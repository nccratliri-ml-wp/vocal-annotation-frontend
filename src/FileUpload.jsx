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
                            passSpecCallMethodToScalableSpec,
                            passNfftToScalableSpec,
                            passBinsPerOctaveToScalableSpec,
                            passMinFreqToScalableSpec,
                            passMaxFreqToScalableSpec,
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
            handleResponseData(response)
        } catch (error) {
            handleUploadError(error)
        }
    }

    const handleResponseData = (response) => {
        passResponseToScalableSpec( response.data.channels[0] )
        deletePreviousTrackDurationInApp( previousAudioDuration ) // Remove outdated track duration of the previous file in the App component
        passTrackDurationToApp( response.data.channels[0].audio_duration )
        passGlobalHopLengthToApp(response.data.configurations.hop_length)
        passGlobalNumSpecColumns(response.data.configurations.num_spec_columns)
        passGlobalSamplingRate(response.data.configurations.sampling_rate)
        passSpecCallMethodToScalableSpec(response.data.configurations.spec_cal_method)
        passNfftToScalableSpec(response.data.configurations.n_fft)
        passBinsPerOctaveToScalableSpec(response.data.configurations.bins_per_octave)
        passMinFreqToScalableSpec(response.data.configurations.min_frequency)
        passMaxFreqToScalableSpec(response.data.configurations.max_frequency)
    }

    const handleUploadError = (error) => {
        passSpectrogramIsLoadingToScalableSpec( false )
        console.error("Error uploading file:", error)
        alert('Error while uploading. Check the console for more information.')
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
                    handleResponseData(response)
                }
            } catch (error){
                handleUploadError(error)
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