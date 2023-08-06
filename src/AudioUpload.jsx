import axios from 'axios'

function AudioUpload( {passAudioDOMObjectURLToApp, passBase64UrlToApp} ){

    function handleChange(event){
        const formData = new FormData();
        formData.append("newAudioFile", event.target.files[0])

        const url = URL.createObjectURL(event.target.files[0])
        passAudioDOMObjectURLToApp( url )

        getSpectrogramFromBackend(formData)
    }

    function getSpectrogramFromBackend(formData){
        axios.post('/upload', formData)
            .then(response => passBase64UrlToApp(response.data))
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
        </form>
    )
}

export default AudioUpload