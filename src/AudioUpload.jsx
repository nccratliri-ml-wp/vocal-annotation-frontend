import {useState} from "react";
import axios from "axios";

function AudioUpload({passAudioDOMObjectURLToApp, passBase64UrlToApp, passAudioFileNameToApp, passSpectrogramIsLoadingToApp} ){

    const [audioFileName, setAudioFileName] = useState(null)


    // Audio Upload and fetch Spectrogram Image implementation
    function handleFileDropped(newFile){
        const formData = new FormData();
        formData.append("newAudioFile", newFile)
        passAudioFileNameToApp( newFile.name )
        setAudioFileName( newFile.name )
        passSpectrogramIsLoadingToApp(true)

        const url = URL.createObjectURL(newFile)
        passAudioDOMObjectURLToApp( url )

        getSpectrogramFromBackend(formData)
    }

    function getSpectrogramFromBackend(formData){
        axios.post('/upload', formData)
            .then(response => {
                passBase64UrlToApp(response.data)
                passSpectrogramIsLoadingToApp(false)
            })
            .catch((error) => console.log(error))
    }


    // Drag & Drop implementation
    const [dragActive, setDragActive] = useState(false)

    function handleDrag(event){
        event.preventDefault()
        event.stopPropagation()
        if (event.type === 'dragenter' || event.type === 'dragover') {
            setDragActive(true)
        } else if (event.type === 'dragleave') {
            setDragActive(false)
        }
    }

    function handleDrop(event){
        event.preventDefault()
        event.stopPropagation()
        setDragActive(false)
        if (event.dataTransfer.files && event.dataTransfer.files[0]){
            handleFileDropped(event.dataTransfer.files[0])
        }
    }

    function handleChange(event){
        event.preventDefault()
        if (event.target.files && event.target.files[0]){
            handleFileDropped(event.target.files[0])
        }
    }

    return (
        <form
            className='form-file-upload'
            onDragEnter={handleDrag}
            onSubmit={(event) => event.preventDefault()}
        >
            <input
                id='audio-file-upload'
                className='input-file-upload'
                type='file'
                accept='.wav'
                multiple={false}
                onChange={handleChange}
            />
            <label
                className='label-file-upload'
                htmlFor='audio-file-upload'
                isdragactive={dragActive ? 'true' : 'false'}
            >
                <div>
                    {audioFileName ? <div><div className='file-icon'>♫</div>{audioFileName}</div> : 'Drag and drop your WAV file or click here to upload'}
                </div>
            </label>
            {
                dragActive &&
                <div
                    className='drag-file-element'
                    onDragEnter={handleDrag}
                    onDragLeave={handleDrag}
                    onDragOver={handleDrag}
                    onDrop={handleDrop}>
                </div>
            }
        </form>
    )
}

export default AudioUpload