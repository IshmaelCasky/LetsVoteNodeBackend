var admin = require("firebase-admin");
var schedule = require('node-schedule');
require('dotenv').config();

var json = {
    "type": process.env.TYPE_NAME,
    "project_id": process.env.PROJECT_ID,
    "private_key_id": process.env.PRIVATE_KEY_ID,
    "private_key":  process.env.PRIVATE_KEY,
    "client_email": process.env.CLIENT_EMAIL,
    "client_id": process.env.CLIENT_ID,
    "auth_uri": process.env.AUTH_URL,
    "token_uri": process.env.TOKEN_URL,
    "auth_provider_x509_cert_url": process.env.AUTH_PROVIDER,
    "client_x509_cert_url": process.env.CLIENT_URL,
};

admin.initializeApp({
  credential: admin.credential.cert(json),
  databaseURL: "https://letsvote-c8f3f-default-rtdb.firebaseio.com"
});

const db = admin.firestore();
let sessions = db.collection('VotingSessions');

let database = null;

const updatedatabase = () => {
    sessions.get().then(snapshot => {
        database = snapshot;
    });
}
updatedatabase();


const checkEnded = schedule.scheduleJob("*/3 * * * * *", function(){
    if(database != null){
        database.forEach(doc => {
            database.forEach(doc => {
                session = doc.data();
                date = new Date(session.SessionEndDate._seconds);
                
                if((date.getTime() * 1000 ) <= new Date().getTime()){
                   // delete session name;
                   updatedatabase();
                   if(session.SessionEnd == false){
                        const candidates = session.Candidates;
                        const entries =  Object.entries(candidates).sort((a,b) => {
                            return b[1].VoteCount - a[1].VoteCount ? b[1].VoteCount - a[1].VoteCount : a[0] > b[0] ? 1 : -1;
                          });
    
                        const obj = {};
    
                        if(entries.length == 1){
                            obj[entries[0][0]] = entries[0][1];
                            session.SessionWinner = obj;
                        } else if (entries.length == 2){
                            obj[entries[0][0]] = entries[0][1];
                            obj[entries[1][0]] = entries[1][1];
                            session.SessionWinner = obj;
                        } else {
                            obj[entries[0][0]] = entries[0][1];
                            obj[entries[1][0]] = entries[1][1];
                            obj[entries[2][0]] = entries[2][1];
                            session.SessionWinner = obj;
                        }
                        session.SessionEnd = true;
                        sessions.doc(doc.id).set(session);
                   }
                }
            });
        });
    }
});

const updateDatabase = schedule.scheduleJob("*/5 * * * * ", function(){
    updatedatabase();
});