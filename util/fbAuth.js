const { db, admin } = require('./admin');

// auth to verify token id
module.exports = (req, res, next) => {
    let idToken;
    if(req.headers.authorization && req.headers.authorization.startsWith('Bearer ')) {
        idToken = req.headers.authorization.split('Bearer ')[1];
        //console.log('idtoken', idToken);
    } else {
        console.log('No token found');
        return res.status(403).json({ error: 'Unauthorized'});
    }
    
    admin.auth().verifyIdToken(idToken)
        .then(decodedToken => {
            //console.log('decodedtoken',decodedToken);
            req.user = decodedToken;
            return db.collection('users').where('accountId', '==', req.user.uid).get();

        })
        .then(data => {
            req.user.firstName = data.docs[0].data().firstName;
            req.user.lastName = data.docs[0].data().lastName;
            req.user.userId = data.docs[0].data().userId;
            req.user.address = data.docs[0].data().address;
            req.user.email = data.docs[0].data().email;
            req.user.role = data.docs[0].data().role;
            console.log(req.user.employeeId);
            console.log(req.user.name);
            return next();
        })
        .catch(err => {
            console.error('Error with verifying token', err);
            return res.status(403).json(err);
        })
}
