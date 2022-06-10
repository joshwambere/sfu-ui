let localStream;
const memberId = String(`apollo${Math.floor(Math.random()*10000)}`);
let remoteStream;
let peerConnection;
const url='https://apollo-sfu.herokuapp.com/'
const server = {
    iceServers: [
        {
            urls: ["stun:stun.l.google.com:19302"]
        }
    ]
};
const constraints={
    video:{
        width:{
            min:640,
            ideal:2560,
            max:2560
        },
        height:{
            min:480,
            ideal:1080,
            max:1080
        }
    },
    audio:true
}
const init = async () => {
    const link = `${url}stream`;

    const offer = await createOffer(memberId)

    localStream = await navigator.mediaDevices.getUserMedia(constraints)
    const { data } = await axios.post(link, offer.offer);

    if(data.sdp){
        document.getElementById('camera-btn').style.background='#f54343';
        await addAnswer(data.sdp);
    }
    document.getElementById('user').srcObject = localStream;
    document.getElementById('user').muted = true;


}

// const handleMessageFromPeer = async(message, memberId)=>{
//     const messageObj = JSON.parse(message.text);
//     if(messageObj.type === "offer"){
//         await createAnswer(memberId, messageObj.offer);
//     }
//     if(messageObj.type === "answer"){
//         await addAnswer(messageObj.answer);
//     }
//     if(messageObj.type === "candidate"){
//         if (peerConnection){
//             await peerConnection.addIceCandidate(messageObj.candidate);
//         }
//     }
// }
const createPeerConnection = async()=>{
    peerConnection = new RTCPeerConnection(server);

    remoteStream = new MediaStream();
    if (!localStream) {
        localStream = await navigator.mediaDevices.getUserMedia({audio:true, video:true})
        document.getElementById('user').srcObject = localStream;
    }
    //add audio and video tracks to an offer given to the remote peer
    localStream.getTracks().forEach(track => peerConnection.addTrack(track, localStream));
    peerConnection.ontrack = event => {
        event.streams[0].getTracks().forEach(track => remoteStream.addTrack(track));
    }
}

const setIceCandidate = async(e) =>{
    if(peerConnection){
        await peerConnection.addIceCandidate(e.candidate);
    }
}
// create offer for a remote peer
const createOffer= async(memberId)=>{
    await createPeerConnection();
    let offer = await peerConnection.createOffer()
    await peerConnection.setLocalDescription(offer);
    return {'offer':peerConnection.localDescription, type:'offer', memberId}

}

const addAnswer = async(answer)=>{
    if(!peerConnection.currentRemoteDescription){
        await peerConnection.setRemoteDescription(answer);

        if(peerConnection){
            peerConnection.onicecandidate = e => {
                if (e.candidate) {
                    setIceCandidate(e)
                }
            }
        }
    }
}


init()
document.getElementById('camera-btn').addEventListener('click', async () => { window.location='../views/end.html' });
