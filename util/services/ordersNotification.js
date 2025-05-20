import admin from "firebase-admin" ;
import path from "path" ;
import { fileURLToPath } from "url" ;
import fs from "fs";


const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);






const serviceAccount = JSON.parse(
  fs.readFileSync(path.join(__dirname, "../../firebase.json"), "utf-8")
);


if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
  });
}

export const sendNotification = async (deviceToken, title, body, data = {}) => {
  const message = {
    notification: {
      title: title,
      body: body,
    },
    data: data, 
    token: deviceToken,
  };

  try {
    const response = await admin.messaging().send(message);
    console.log('✅ Notification sent successfully:', response);
  } catch (error) {
    console.error('❌ Error sending notification:', error);
  }
};



