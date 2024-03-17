import React, {useEffect} from "react";
import axios from "axios";
import {useLocation} from "react-router-dom";

function FileUpload(
                        {
                            passResponseToScalableSpec,
                            passSpectrogramIsLoadingToScalableSpec,
                            passTrackDurationToApp,
                            deletePreviousTrackDurationInApp,
                            previousAudioDuration,
                            passGlobalHopLengthToApp,
                            passGlobalNumSpecColumns,
                            passGlobalSamplingRate,
                            passMaxFreqToScalableSpec,
                            passAudioIdToScalableSpec,
                            deleteAllLabels
                        }
                    )
                {

    const location = useLocation();

    const handleFileChange = (event) => {
        const file = event.target.files[0];
        if (file && (file.type === 'audio/wav' || file.type === 'audio/mp3' || file.type === 'audio/mpeg')) {
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
            passResponseToScalableSpec( response.data.channels[0] )
            deletePreviousTrackDurationInApp( previousAudioDuration ) // Remove outdated track duration of the previous file in the App component
            passTrackDurationToApp( response.data.channels[0].audio_duration )
            passGlobalHopLengthToApp(response.data.configurations.hop_length)
            passGlobalNumSpecColumns(response.data.configurations.num_spec_columns)
            passGlobalSamplingRate(response.data.configurations.sampling_rate)
            passMaxFreqToScalableSpec(response.data.configurations.max_frequency)
            passAudioIdToScalableSpec(response.data.channels[0].audio_id)
            deleteAllLabels()
        } catch (error) {
            passSpectrogramIsLoadingToScalableSpec( false )
            console.error("Error uploading file:", error)
            alert('Error while uploading. Check the console for more information.')
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
                audio_url: audioURL
            }

            try {
                const response = await axios.post(path, requestParameters)
                if (!ignore){
                    passResponseToScalableSpec( response.data.channels[0] )
                    deletePreviousTrackDurationInApp( previousAudioDuration ) // Remove outdated track duration of the previous file in the App component
                    passTrackDurationToApp( response.data.channels[0].audio_duration )
                    passGlobalHopLengthToApp(response.data.configurations.hop_length)
                    passGlobalNumSpecColumns(response.data.configurations.num_spec_columns)
                    passGlobalSamplingRate(response.data.configurations.sampling_rate)
                    passMaxFreqToScalableSpec(response.data.configurations.max_frequency)
                    passAudioIdToScalableSpec(response.data.channels[0].audio_id)
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
            <input className='file-input' type="file" accept=".wav, .mp3" onChange={handleFileChange} />
        </div>
    )
}

export default FileUpload