import React, {useEffect} from "react";
import axios from "axios";
import {useLocation} from "react-router-dom";

function FileUpload( { passResponseToScalableSpec, passSpectrogramIsLoadingToScalableSpec, passTrackDurationToApp, deletePreviousTrackDurationInApp, previousAudioDuration} ) {

    const location = useLocation();

    const handleFileChange = (event) => {
        const file = event.target.files[0];
        if (file && file.type === 'audio/wav') {
            passSpectrogramIsLoadingToScalableSpec( true )
            upload(file)
        } else {
            alert('Please select a valid .wav file.')
        }
    }

    const upload = ( file ) => {
        if (!file) return
        const formData = new FormData();
        formData.append('newAudioFile', file)
        getBase64String( formData )
    }

    const getBase64String = async (formData) => {
        const path = import.meta.env.VITE_BACKEND_SERVICE_ADDRESS+'upload'
        try {
            const response = await axios.post(path, formData)
            console.log('prev duration is: ' + previousAudioDuration)
            passResponseToScalableSpec( response )
            deletePreviousTrackDurationInApp( previousAudioDuration ) // Remove outdated track duration of the previous file in the App component
            passTrackDurationToApp( response.data.audio_duration )
        } catch (error) {
            console.error("Error uploading file:", error)
        }
    }

    // When url parameter is added into the searchbar
    useEffect( () => {
        let ignore = false

        const queryParams = new URLSearchParams(location.search);
        const audioUrlParam = queryParams.get('audio_url');

        const uploadFileByURL = async (audioURL) => {
            passSpectrogramIsLoadingToScalableSpec( true )
            const path = import.meta.env.VITE_BACKEND_SERVICE_ADDRESS+'upload-by-url'
            const requestParameters = {
                //audio_url: 'https://storage.googleapis.com/callbase_bucket/XC633481-RFW_.mp3?X-Goog-Algorithm=GOOG4-RSA-SHA256&X-Goog-Credential=callbase-storage-management%40callbase-395411.iam.gserviceaccount.com%2F20240222%2Fauto%2Fstorage%2Fgoog4_request&X-Goog-Date=20240222T135207Z&X-Goog-Expires=604800&X-Goog-SignedHeaders=host&X-Goog-Signature=171057da4032d1ee38946369ab9b0bd090539b7d258c7fb1f9b057120b5e6ed9bcdb9f585d0648852e78b10baee07882f813e1278d227dad2b17f0410ae91e4c0a472210485a8d085c6ffa0f3ddfe7f038fee2c9d0089b0980d44ea00cf32d58542bbca37f2bf0cfccc1220ee26ce242340f2fbc238f9b8c0d85bc4d4e975d926e93c58313bc60bb0d40620dfaaeea85068d17282a2e94c7dae6d87b4eb88ffd8794c53a41e936e94df8f59bf28d76dc7042671053fb80f95a94ad2e60bf168784941c52dcbeef7b4575d15649a971e968b8b934f2eba5a2f4862a35727b75d76b7d672791cfc1837a32cd421e80b016722e446bc8b981a0fdd548636fdc8843',
                //audio_url: 'https://www2.cs.uic.edu/~i101/SoundFiles/BabyElephantWalk60.wav'
                audio_url: audioURL
            }

            try {
                const response = await axios.post(path, requestParameters)
                if (!ignore){
                    passResponseToScalableSpec( response )
                    deletePreviousTrackDurationInApp( previousAudioDuration ) // Remove outdated track duration of the previous file in the App component
                    passTrackDurationToApp( response.data.audio_duration )
                }
            } catch (error){
                passSpectrogramIsLoadingToScalableSpec( false )
                console.error("Error uploading file:", error)
                alert('Error while uploading. Make sure the URL to the file is correct and try again.')
            }
        }

        if (audioUrlParam) {
            const decodedURL = decodeURIComponent(audioUrlParam)
            uploadFileByURL(decodedURL)
        }

        return () => {
            ignore = true
        }

    }, [location])

    return (
        <div>
            <input className='file-input' type="file" accept=".wav" onChange={handleFileChange} />
        </div>
    )
}

export default FileUpload