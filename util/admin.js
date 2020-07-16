const admin = require('firebase-admin');
//var serviceAccount = require("C:\Users\Vu\Downloads\porfolio-75b55-firebase-adminsdk-y5gc0-34036b3a58.json");
admin.initializeApp(
    // credential: admin.credential.cert(serviceAccount),
    // databaseURL: "https://porfolio-75b55.firebaseio.com"
    );
const db = admin.firestore();

module.exports = { admin, db };

