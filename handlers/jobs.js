const { db, admin } = require('../util/admin');
const firebase = require('firebase');
const FieldValue = require('firebase-admin').firestore.FieldValue;

const { reduceJobDetails } = require('../util/validators');

// create new job and post to jobs collection
exports.createJob = (req, res) => {
    const jobDetails = {
        name: req.body.name,
        candidate: [],
        description: req.body.description,
        createdOn: new Date().toISOString(),
        createdBy: req.user.name,
        updatedBy: null
    }
    db.collection('jobs').add(jobDetails)
        .then(doc => {
            return res.json({ message: `${doc.id} created successfully `});
        })
        .catch(err => res.json(err));
}

exports.updateJob = (req, res) => {
    //let lastModifiedOn;
    const jobDetails = reduceJobDetails(req.body);
    db.doc(`/jobs/${req.params.jobId}`)
        .get()
        .then(doc => {
            if(!doc.exists) {
                return res.status(404).json({ error: 'jobId not found' });
            } else {
                jobDetails.updatedBy = req.user.name;
                jobDetails.lastModifiedOn = new Date().toISOString();
                return db.doc(`/jobs/${req.params.jobId}`).update(jobDetails);
            }
        })
        .then(() =>{
            res.json({message: `job ${req.params.jobId} updated successfully`});
        })
        .catch(errors => {
            console.error(errors);
        })
}

exports.addPotentialCandidate = (req, res) => {
    db.doc(`/jobs/${req.params.jobId}`)
    .get()
    .then(doc => {
        //console.log('firebasedefine',firebase);
        console.log('document info', doc.data());
        console.log('document name', doc.data().name);
        //console.log('candidate array', doc.data().candidate);
        if(!doc.exists) {
            return res.status(404).json({ error: 'jobId not found' });
        } else {
            //jobDetails.updatedBy = req.user.name;
            //jobDetails.lastModifiedOn = new Date().toISOString();

            // NEED FIX HERE AS ON THE BOARD

            return db.doc(`/jobs/${req.params.jobId}`).update({candidate: FieldValue.arrayUnion(req.params.employeeId), rating: req.body.rating}).then(() =>{
                res.json({message: `job ${req.params.jobId} updated successfully`});
            }).catch(errors => {
                console.error(errors);
            })
        }
    })
    .then(() =>{
        res.json({message: `job ${req.params.jobId} updated successfully`});
    })
    .catch(errors => {
        console.error(errors);
    })
}