// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import {getDownloadURL, getStorage, ref, uploadBytesResumable} from "firebase/storage"
import { fi } from "date-fns/locale";
import { error } from "console";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "securitykey",
  authDomain: "gitexplore-54c06.firebaseapp.com",
  projectId: "gitexplore-54c06",
  storageBucket: "gitexplore-54c06.firebasestorage.app",
  messagingSenderId: "76046283086",
  appId: "1:76046283086:web:5b0f3c2fd54bb2228c6e1f",
  measurementId: "G-68YCEZVSDK"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
export const storage=getStorage(app);

export async function uploadFile(file:File,setProgress?:(progress:number)=>void){
    return new Promise((resolve,reject)=>{
        try{
            const storageRef = ref(storage,file.name)
            const uploadTask=uploadBytesResumable(storageRef,file)

            uploadTask.on('state_changed',snapshot=>{
                const progress = Math.round((snapshot.bytesTransferred/snapshot.totalBytes)*100)
                if (setProgress) setProgress(progress)
                switch(snapshot.state){
                    case 'paused':
                        console.log('upload is paused'); break;
                    case 'running':
                        console.log('upload is running');
                        break;
                }
            },error=>{
                reject(error)
            },()=>{
                getDownloadURL(uploadTask.snapshot.ref).then(downloadUrl=>{
                    resolve(downloadUrl as string)
                })
            })

        } catch(error){
            console.error(error)
            reject(error)
        }
    })
}
