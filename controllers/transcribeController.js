// This is my transcribeController.js:
const serviceAccount = require("../../recipes-fdw-firebase-adminsdk-zggy2-4e43228257.json");
const speech = require("@google-cloud/speech").v2;
const client = new speech.SpeechClient({
  credentials: {
    private_key: serviceAccount.private_key,
    client_email: serviceAccount.client_email,
  },
  apiEndpoint: `us-central1-speech.googleapis.com`,
});
const axios = require("axios");
const { database } = require("firebase-admin");
const { getStorage, getDownloadURL } = require("firebase-admin/storage");
const FormData = require("form-data");
const os = require("os");
const TemporaryDirectoryPath = os.tmpdir();
const fs = require("fs");

const { downloadFile } = require("../utils/downloadFile");
const { compressImage } = require("../utils/compressImage");
const {
  mapCloudSpeechToTeleprompter,
} = require("../utils/mapCloudSpeechToTeleprompter");

const handleLongAudioTranscription = async (
  uid,
  audioFile,
  key,
  id,
  languageInput,
  languageOutput
) => {
  try {
    // upload audio file to Cloud Storage - CRITICAL so we do not lose the audio file
    await getStorage()
      .bucket()
      .upload(audioFile.path, {
        destination: `${uid}/${id}.m4a`,
        contentType: "audio/m4a",
      });
    const audioFileUri = await getDownloadURL(
      getStorage().bucket().file(`${uid}/${id}.m4a`)
    );

    console.log(`Audio file can be downloaded from ${audioFileUri}`);

    let languageIn;
    if (!languageInput) {
      languageIn = "en";
    } else {
      languageIn = languageInput;
    }
    let languageOut;
    if (!languageOutput) {
      languageOut = "en";
    } else {
      languageOut = languageOutput;
    }

    console.log("Processing audio...");

    // Use Google Cloud Speech-to-text for transcription using batch recognizer which can process up to 8hrs long audios
    const fullPath = getStorage().bucket().file(`${uid}/${id}.m4a`)
      .cloudStorageURI.href;

    console.log(`Full path: ${fullPath}`);

    const audioFiles = [{ uri: fullPath }];

    // Full recognizer resource name created from https://console.cloud.google.com/speech/recognizers/list?hl=en&project=recipes-fdw
    const recognizerName =
      "projects/recipes-fdw/locations/us-central1/recognizers/voicepal-recognizer";

    const recognitionConfig = {
      autoDecodingConfig: {},
      model: "chirp",
      languageCodes: ["auto"],
      features: {
        enableWordTimeOffsets: false,
        enable_word_confidence: false,
      },
    };

    const outputPath = {
      // gcsOutputConfig: {
      //   uri: workspace,
      // },
      inlineResponseConfig: {},
    };

    const request = {
      recognizer: recognizerName,
      files: audioFiles,
      config: recognitionConfig,
      recognitionOutputConfig: outputPath,
    };

    const callBatchRecoqnize = async () => {
      const [operation] = await client.batchRecognize(request);
      const [response] = await operation.promise();
      return response;
    };

    const response = await callBatchRecoqnize();
    // console.log(JSON.stringify(response, null, 2));

    const { teleprompter, rawTranscript } =
      mapCloudSpeechToTeleprompter(response);

    process.on("unhandledRejection", (err) => {
      console.error(err.message);
      process.exitCode = 1;
    });

    console.log("Raw transcript and teleprompter generated.");
    // console.log(JSON.stringify(teleprompter, null, 2));
    // console.log(`Raw transcript: ${rawTranscript}`);

    const apikey = process.env.OPENAI_API_KEY;

    const chatCompletionHeaders = {
      // Accept: "application/json",
      "Content-Type": "application/json",
      Authorization: `Bearer ${apikey}`,
    };

    let translationPrompt = "";
    if (languageIn !== languageOut) {
      translationPrompt = `and translate it from ${languageIn} to ${languageOut}.`;
    } else {
      translationPrompt = `making sure that the language is ${languageOut}.`;
    }

    const chatCompletionBody = {
      user: uid,
      model: "gpt-3.5-turbo-1106",
      messages: [
        {
          role: "system",
          content: `You are a professional editor. The user will provide you with a transcript, like this Text: "example transcript" and you will need to clean it up and make it publish-ready. By publish-ready, I mean that it does not contain any filling words such as yeah, um, or anything that makes reading it a chore. As you do so, don't use words that aren't used in the Text. Also, make sure that the language is correct according to what the user wants. The user will ask for the output to be in JSON format, with three fields: "cleanedTranscript", "title", and "summary".`,
        },
        {
          role: "user",
          content: `Please take the Text and clean it up to make it publish-ready. ${translationPrompt} Text: "${rawTranscript}". Give me the output generated in JSON format with three fields: "cleanedTranscript", "title", "summary"`,
        },
      ],
      temperature: 0,
      top_p: 1,
      n: 1,
      stream: false,
      max_tokens: 2000,
      presence_penalty: 0,
      frequency_penalty: 0,
      response_format: { type: "json_object" },
    };

    // Use OpenAI Chat Completion API for generating title and summary
    const chatCompletionResponse = await axios.post(
      "https://api.openai.com/v1/chat/completions",
      chatCompletionBody,
      {
        headers: chatCompletionHeaders,
      }
    );

    // console.log(
    //   `Chat Completion API response: ${JSON.stringify(
    //     chatCompletionResponse.data,
    //     null,
    //     2
    //   )}`
    // );

    // Process the Chat Completion API response
    const { cleanedTranscript, title, summary } = JSON.parse(
      chatCompletionResponse.data.choices[0].message.content
    );

    console.log("Cleaned transcript, title and summary generated.");
    // console.log(`Cleaned transcript: ${cleanedTranscript}`);
    // console.log(`Title: ${title}`);
    // console.log(`Summary: ${summary}`);

    // Store the information in Firebase Realtime Database
    const audioRef = database().ref(`userData/${uid}/audios/${key}`);
    await audioRef.update({
      audioFileUri,
      rawTranscript,
      teleprompter,
      cleanedTranscript,
      title,
      summary,
      isProcessing: false,
    });

    const imageGenerationHeaders = {
      Accept: "application/json",
      "Content-Type": "application/json",
      Authorization: `Bearer ${apikey}`,
    };
    const imageGenerationBody = {
      user: uid,
      model: "dall-e-3",
      prompt: `Create an image from the following Summary. Summary: "${summary}". Identify the main theme, crucial words, and mood. Craft a detailed, vivid image prompt that visually represents the transcript's essence, including relevant settings, objects, emotions, and activities.`,
      n: 1,
      quality: "standard",
      size: "1792x1024",
    };
    // Use OpenAI DALL-E 3 API for image generation
    const imageGenerationResponse = await axios.post(
      "https://api.openai.com/v1/images/generations",
      imageGenerationBody,
      {
        headers: imageGenerationHeaders,
      }
    );

    // Process the DALL-E 3 API response
    const imageUrl = imageGenerationResponse.data.data[0].url;
    console.log("DALL-E generated an image.");
    // console.log(`Generated image can be downloaded from ${imageUrl}`);

    // Download the image from the URL
    const imageFileName = `${id}.png`;
    const downloadPath = `${TemporaryDirectoryPath}/${imageFileName}`;

    await downloadFile(imageUrl, downloadPath);

    console.log("Image downloaded successfully.");

    // Compress the image")
    const compressedImagePath = await compressImage(
      downloadPath,
      0.7,
      361,
      200
    );
    console.log("Image compressed successfully.");

    // Upload the image to Cloud Storage
    await getStorage()
      .bucket()
      .upload(compressedImagePath, {
        destination: `${uid}/${imageFileName}`,
        contentType: "image/png",
      });
    console.log("Image uploaded successfully.");

    // Get the image URL from Cloud Storage
    const image = await getDownloadURL(
      getStorage().bucket().file(`${uid}/${imageFileName}`)
    );

    console.log(`Image can be downloaded from ${image}`);

    // Store the image information in Firebase Realtime Database
    // const audioRef = database().ref(`userData/${uid}/audios/${key}`);
    await audioRef.update({
      image,
      imageFileName,
      isProcessing: false,
    });

    console.log("Audio processed successfully.");
    return { success: true, message: "Audio processed successfully" };
  } catch (error) {
    console.error("Error processing audio:", error);
    return { error: "Error processing audio" };
  }
};

const transcribeLongAudio = async (req, res) => {
  const { uid } = req;
  const audioFile = req.file;
  const { key, id, languageIn, languageOut } = req.body;

  // console.log("Request Headers:", req.headers);
  // console.log("Request Body:", req.body);

  // console.log(`uid: ${uid}`);
  // console.log(`key: ${key}`);
  // console.log(`id: ${id}`);
  // console.log(`languageIn: ${languageIn}`);
  // console.log(`languageOut: ${languageOut}`);
  // console.log(`audioFile path: ${audioFile.path}`);

  // Check for missing fields

  console.log("Checking for missing fields...");
  if (!uid) {
    return res.status(400).json({ error: "Missing uid" });
  } else if (!key) {
    return res.status(400).json({ error: "Missing key" });
  } else if (!id) {
    return res.status(400).json({ error: "Missing id" });
  }

  // // Response for successful receiving of file and fields
  // return res.status(200).json({
  //   success: true,
  //   message: "File upload complete, idToken, key, and id received",
  // });
  // console.log("Fields received successfully.");

  // Process the audio

  const result = await handleLongAudioTranscription(
    uid,
    audioFile,
    key,
    id,
    languageIn,
    languageOut
  );
  if (result.success) {
    return res.status(200).json(result);
  } else {
    return res.status(500).json(result);
  }
};

module.exports = {
  transcribeLongAudio,
};
