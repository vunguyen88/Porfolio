const { db, admin } = require('../util/admin');
const firebase = require('firebase');

require("firebase/storage");

const config = require('../util/config');
firebase.initializeApp(config);
const storage = firebase.storage();
const { validateLoginData, validateSignupData } = require('../util/validators');

// const uuidv4 = require('uuid/v4');
//     const uuid = uuidv4();
//     metadata: { firebaseStorageDownloadTokens: uuid }

exports.createUser = (req, res) => {
    if(req.method !== 'POST') {
        return res.status(400).json({ error: 'Method not allow' });
    }
    let newUser = {
        name: req.body.name,
        phone: req.body.phone,
        createAt: new Date().toISOString()
    }
    db.collection('users').add(newUser)
        .then(doc => {           
            res.json({ message: `document ${doc.id} created` });
        })
        .catch(err => console.error(err))
}

exports.getUsers = (req, res) => {
    db.collection('users').get()
        .then(data => {
            let users = [];
            data.forEach(doc => {
                users.push({
                    userId: doc.id,
                    ...doc.data()
                });
            });
            return res.json(users);
        })
        .catch(err => console.error(err));
}

exports.signUp = (req, res) => {
    const newUser = {
        email: req.body.email,
        password: req.body.password,
        firstName: req.body.firstName,
        lastName: req.body.lastName,
        phone: req.body.phone,
        address: {
            street: req.body.address.street,
            city: req.body.address.city,
            zipcode: req.body.address.zipcode,
            state: req.body.address.state,
            country: req.body.address.country,
        },
        createdAt: new Date().toISOString(),
        //employeeId: req.body.employeeId,
        role: 'user',
        isHired: false
    };

    // give the image(reupload) for user when signup
    //const blankimage = 'blankimage.jpg'

    const { valid,errors } = validateSignupData(newUser);
    if(!valid) return res.status(400).json(errors);
    
    // validate data
    let token, userId, accountId;
    // db.doc(`/users/${newUser.employeeId}`).get()
    //     .then(doc => {
    //         //console.log('hereere');
    //         if(doc.exists) {
    //             return res.status(400).json({ employeeId: 'this employeeId is already taken' }) 
    //         } else {
    //             return firebase.auth().createUserWithEmailAndPassword(newUser.email, newUser.password)
    //         }
    //     }) 
    firebase.auth().createUserWithEmailAndPassword(newUser.email, newUser.password)
        .then(data => {
            accountId = data.user.uid;
            return data.user.getIdToken();
        })
        .then(tokenId => {
            console.log('token',token);
            token = tokenId;
            // const userCredentials = {
            //     email: newUser.email,
            //     createdAt: new Date().toISOString(),
            //     firstName: newUser.firstName,
            //     lastName: newUser.lastName,
            //     // accountId: accountId,
            //     // employeeId: newUser.employeeId,
            //     role: newUser.role,
            //     // add image
            //     // imageUrl: `https://firebasestorage.googleapis.com/v0/b/${config.storageBucket}/o/${blankimage}?alt=media`

            // };
            return db.collection('users').add(newUser);
        })
        .then((doc) => {
            userId = doc.id;
            return db.doc(`/users/${userId}`).update({ userId: userId, accountId: accountId });
            // return res.status(200).json( {token} );
        })
        .then(() => {
            return res.status(200).json({ message: 'user created successfully' });
        })
        .catch(err => {
            console.error(err);
            if(err.code === "auth/email-already-in-use") {
                return res.status(400).json({ email: 'email is already in used' });
            } else {
            return res.status(500).json({ error: err.code });
            }
        })
}

//login route using token
exports.login = (req, res) => {
    const userLogin = {
        email: req.body.email,
        password: req.body.password
    };

    const { valid, errors } = validateLoginData(userLogin);
    if(!valid) return res.status(400).json(errors);

    firebase.auth().signInWithEmailAndPassword(userLogin.email, userLogin.password)
        .then(data => {
            return data.user.getIdToken();
        })
        .then(token => {
            return res.json({ token });
        })
        .catch(err => {
            console.error(err);
            return res.status(500).json({ error: err.code });
        })
}

exports.uploadImage = (req, res) => {
    //console.log('@@@@', req.user.employeeId);
    const BusBoy = require('busboy');
    const path = require('path');
    const os = require('os');
    const fs = require('fs');

    const busboy = new BusBoy({ headers: req.headers });

    let imageFileName;
    let imageToBeUploaded = {};

    busboy.on('file', (fieldname, file, filename, encoding, mimetype) => {
        console.log(fieldname);
        console.log(filename);
        console.log(mimetype);

        // image.png or my.image.png
        const imageExtension = filename.split('.')[filename.split('.').length - 1];
        const imageFileName = `${Math.round(Math.random() * 100000000000)}.${imageExtension}`;
        const filepath = path.join(os.tmpdir(), imageFileName);
        imageToBeUploaded = { filepath, mimetype };  
        file.pipe(fs.createWriteStream(filepath));     
    });
    busboy.on('finish', () => {
        admin.storage().bucket().upload(imageToBeUploaded.filepath, {
            resumable: false,
            metadata: {
                metadata: {
                    contentType: imageToBeUploaded.mimetype
                }
            }
        })
        .then(() => {
            const imageUrl = `https://firebasestorage.googleapis.com/v0/b/${config.storageBucket}/o/${imageFileName}?alt=media`
            return db.doc(`/users/${req.user.employeeId}`).update({ imageUrl: imageUrl });

        })
        .then(() => {
            return res.json({ message: 'Image uploaded successfully' });
        })
        .catch(err => {
            console.error(err);
            return res.status(500).json({ error: err.code });
        })
    });
    busboy.end(req.rawBody);
}

// working
exports.uploadFile = (req, res) => {
    const BusBoy = require('busboy');
    const path = require('path');
    const os = require('os');
    const fs = require('fs');

    const busboy = new BusBoy({ headers: req.headers });

    let uploadFileName;
    let fileToBeUploaded = {};

    busboy.on('file', (fieldname, file, filename, encoding, mimetype) => {
        console.log('fieldname: ', fieldname);
        console.log('filename: ', filename);
        console.log('mimetype: ', mimetype);

        // image.png or my.image.png
        //const fileUrl;
        const uploadFileExtension = filename.split('.')[filename.split('.').length - 1];
        const uploadFileName = `${Math.round(Math.random() * 100000000000)}.${uploadFileExtension}`;
        const filepath = path.join(os.tmpdir(), uploadFileName);
        fileToBeUploaded = { filepath, mimetype };  
        file.pipe(fs.createWriteStream(filepath));     
    });
    busboy.on('finish', () => {
        admin.storage().bucket().upload(fileToBeUploaded.filepath, {
            resumable: true,
            // Support for HTTP requests made with `Accept-Encoding: gzip`
            gzip: true,
            // setting the option `destination`, you can change the name of the object you are uploading to a bucket.
            destination: 'resume2',
            // make upload file public read and then restrict access to only recruiter and admin
            predefinedAcl: 'publicRead',
            metadata: {
                metadata: {
                    contentType: fileToBeUploaded.mimetype,
                    // firebaseStorageDownloadTokens: uuidv4(),
                }
            }
        })
        .then(result => {
            const file = result[0];
            // also can getSignedUrl() and makePublic() ...
            return file.getMetadata();
        })
        .then(result => {
            const metadata = result[0];
            console.log('metadata =', metadata.mediaLink);
            return db.doc(`/users/${req.user.userId}`).update({ resume: metadata.mediaLink });
        })
        .then(() => {
            return res.json({ message: 'resume uploaded successfully' });
        })
        .catch(err => {
            console.error(err);
            return res.status(500).json({ error: err.code });
        })
    });
    busboy.end(req.rawBody);
}

exports.createEmployeeAccount = (req, res) => {
    let accountId;
    let userRecord = {
        email: req.body.email,
        password: req.body.password,
        phone: req.body.phone,
        firstName: req.body.firstName,
        lastName: req.body.lastName,
        role: req.body.role,
        createdOn: new Date().toISOString()
    }

    firebase.auth().createUserWithEmailAndPassword(userRecord.email, userRecord.password)
        .then(data => {
            accountId = data.user.uid;
            return data.user.getIdToken();
        })
        .then(tokenId => {
            return db.collection('users').add(userRecord);
        })
        .then((doc) => {
            userId = doc.id;
            return db.doc(`/users/${userId}`).update({ userId: userId, accountId: accountId });
            // return res.status(200).json( {token} );
        })
        .then(() => {
            return res.status(200).json({ message: 'user created successfully' });
        })
        .catch(err => {
            console.error(err);
            if(err.code === "auth/email-already-in-use") {
                return res.status(400).json({ email: 'email is already in used' });
            } else {
            return res.status(500).json({ error: err.code });
            }
        })
}

exports.getUrl = (req,res) => {
    //const path = require('path');
    const fs = require('fs');
    let downloadDest = '/Users/Vu/Documents/FirebaseDownload';
    try {
        if (fs.existsSync(downloadDest)) {
          console.log("Directory exists.")
        } else {
          console.log("Directory does not exist.")
          fs.mkdirSync(downloadDest)
          console.log("Directory is created.");
          console.log('check destination again', fs.existsSync(downloadDest));
        }
      } catch(e) {
        console.log("An error occurred.")
      }
      const filename = ('31892019612.JPG');
      const bucketName = 'porfolio-75b55.appspot.com';

      const {Storage} = require('@google-cloud/storage');

      // Creates a client
      const storage = new Storage({
        project_id: "test-28dd6",
        keyFilename: "access-porfolio@test-28dd6.iam.gserviceaccount.com"
      });
    
      async function generateSignedUrl() {
        // These options will allow temporary read access to the file
        const options = {
          version: 'v2', // defaults to 'v2' if missing.
          action: 'read',
          expires: Date.now() + 1000 * 60 * 60, // one hour
        };
    
        // Get a v2 signed URL for the file
        const [url] = await storage
          .bucket(bucketName)
          .file(filename)
          .getSignedUrl(options);
    
        console.log(`The signed url for ${filename} is ${url}.`);
      }
    
      generateSignedUrl().then(res.json({ message: `dfgdfgfd`})).catch(console.error);
      // [END storage_generate_signed_url]
    }
    //fs.access('C:\Users\Vu')
    // const cwd = path.join(__dirname,'..');
    // const bucketName = 'sunshineenterpriseus.appspot.com';
    // const srcFilename = 'firebaselocal.txt';
    // const destFilename = path.join(cwd, 'downloaded.txt')
    // const {Storage} = require('@google-cloud/storage');
    // const storage = new Storage();
    // async function downloadFile() {
    //     const options = {
    //         destination: destFilename,
    //     }
    //     await storage.bucket(bucketName).file(srcFilename).download(options);
    //     console.log(
    //         `gs://${bucketName}/${srcFilename} downloaded to ${destFilename}.`
    //     )
    // }
    // downloadFile().then(res.json({ message: `download successfully` })).catch(console.error);

exports.uploadSignUrl = (req,res) => {
    const {Storage} = require('@google-cloud/storage');

    // Instantiates a client. If you don't specify credentials when constructing
    // the client, the client library will look for credentials in the
    // environment.
    const storage = new Storage();
    // Makes an authenticated API request.
    async function listBuckets() {
    try {
        const results = await storage.getBuckets();

        const [buckets] = results;

        console.log('Buckets:');
        buckets.forEach((bucket) => {
        console.log(bucket.name);
        });
    } catch (err) {
        console.error('ERROR:', err);
    }
    }
    listBuckets();

        // const {Storage} = require('@google-cloud/storage');
        // const filename = ('31892019612.JPG');
        // const bucketName = 'porfolio-75b55.appspot.com';
        // // Creates a client
        // const storage = new Storage();

        // async function generateV4UploadSignedUrl() {
        //     // These options will allow temporary uploading of the file with outgoing
        //     // Content-Type: application/octet-stream header.
        //     const options = {
        //     version: 'v4',
        //     action: 'write',
        //     expires: Date.now() + 15 * 60 * 1000, // 15 minutes
        //     contentType: 'application/octet-stream',
        //     };

        //     // Get a v4 signed URL for uploading file
        //     const [url] = await storage
        //     .bucket(bucketName)
        //     .file(filename)
        //     .getSignedUrl(options);

        //     console.log('Generated PUT signed URL:');
        //     console.log(url);
        //     console.log('You can use this URL with any user agent, for example:');
        //     console.log(
        //     "curl -X PUT -H 'Content-Type: application/octet-stream' " +
        //         `--upload-file my-file '${url}'`
        //     );
        // }

        // generateV4UploadSignedUrl().catch(console.error);
        // [END storage_generate_upload_signed_url_v4]
    }