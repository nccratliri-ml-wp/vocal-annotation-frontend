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
                            passSpecCalMethodToScalableSpec,
                            passNfftToScalableSpec,
                            passBinsPerOctaveToScalableSpec,
                            passMinFreqToScalableSpec,
                            passMaxFreqToScalableSpec,
                            passDefaultConfigToApp
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
        passSpecCalMethodToScalableSpec(response.data.configurations.spec_cal_method)
        passNfftToScalableSpec(response.data.configurations.n_fft)
        passBinsPerOctaveToScalableSpec(response.data.configurations.bins_per_octave)
        passMinFreqToScalableSpec(response.data.configurations.min_frequency)
        passMaxFreqToScalableSpec(response.data.configurations.max_frequency)
        passDefaultConfigToApp({
            hop_length: response.data.configurations.hop_length,
            num_spec_columns: response.data.configurations.num_spec_columns,
            sampling_rate: response.data.configurations.sampling_rate
        })
    }

    const handleUploadError = (error) => {
        passSpectrogramIsLoadingToScalableSpec( false )
        console.error("Error uploading file:", error)
        alert('Error while uploading. Check the console for more information.')
    }

    // When url parameter is added into the searchbar
    useEffect( () => {
        let ignore = false

        const queryParams = new URLSearchParams(location.search)
        const audioUrl = queryParams.get('audio_url') ? decodeURIComponent(queryParams.get('audio_url')) : null
        const hopLength = queryParams.get('hop_length') ? Number(queryParams.get('hop_length')) : null
        const numSpecColumns = queryParams.get('num_spec_columns') ? Number(queryParams.get('num_spec_columns')) : null
        const samplingRate = queryParams.get('sampling_rate') ? Number(queryParams.get('sampling_rate')) : null
        //const specCalMethod = queryParams.get('spec_cal_method')

        const uploadFileByURL = async () => {
            passSpectrogramIsLoadingToScalableSpec( true )
            const path = import.meta.env.VITE_BACKEND_SERVICE_ADDRESS+'upload-by-url'
            const requestParameters = {
                audio_url: audioUrl,
                hop_length: hopLength,
                num_spec_columns: numSpecColumns,
                sampling_rate: samplingRate,
                //spec_cal_method: specCalMethod,
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

        if (audioUrl) {
            uploadFileByURL()
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