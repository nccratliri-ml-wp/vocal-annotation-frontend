import axios from 'axios'

const formData = new FormData();

function AudioUpload( {passAudioDOMObjectURLToApp, passBase64UrlToApp} ){

    function handleChange(event){
        formData.append("newAudioFile", event.target.files[0])

        const url = URL.createObjectURL(event.target.files[0])
        passAudioDOMObjectURLToApp( url )
    }

    function submit(event){
        event.preventDefault()
        axios.post(
            '/upload',
            formData)
            .then(response => {
                passBase64UrlToApp(response.data)
            })
            .catch((error) => console.log(error.response))
    }


    return (
        <form id='audio-file-form'>
            <input
                type='file'
                accept='.wav'
                id='audioFile'
                onChange={handleChange}
            />
            <button onClick={submit}>
                Submit
            </button>
        </form>
    )
}

export default AudioUpload