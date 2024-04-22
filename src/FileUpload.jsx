import React, {useEffect} from "react";
import axios from "axios";
import {useLocation} from "react-router-dom";

function FileUpload(
                        {
                            specCalMethod,
                            nfft,
                            binsPerOctave,
                            minFreq,
                            maxFreq,
                            passResponseToScalableSpec,
                            passSpectrogramIsLoadingToScalableSpec,
                            passTrackDurationToApp,
                            deletePreviousTrackDurationInApp,
                            previousAudioDuration,
                            passGlobalHopLengthToApp,
                            passGlobalNumSpecColumnsToApp,
                            passGlobalSamplingRateToApp,
                            passSpecCalMethodToScalableSpec,
                            passNfftToScalableSpec,
                            passBinsPerOctaveToScalableSpec,
                            passMinFreqToScalableSpec,
                            passMaxFreqToScalableSpec,
                            passDefaultConfigToApp
                        }
                    )
                {

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
        formData.append('spec_cal_method', specCalMethod)
        formData.append('n_fft', nfft)
        formData.append('bins_per_octave', binsPerOctave)
        formData.append('min_frequency', minFreq)
        formData.append('max_frequency', maxFreq)
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
        const trackDuration = response.data.channels[0].audio_duration
        const hopLength = response.data.configurations.hop_length
        const numSpecColumns = response.data.configurations.num_spec_columns
        const samplingRate = response.data.configurations.sampling_rate
        const defaultConfig = {
            hop_length: hopLength,
            num_spec_columns: numSpecColumns,
            sampling_rate: samplingRate
        }

        const newResponseData = response.data.channels[0]
        const newSpecCalMethod = response.data.configurations.spec_cal_method
        const newNfft = response.data.configurations.n_fft
        const newBinsPerOctave = response.data.configurations.bins_per_octave
        const newMinFreq = response.data.configurations.min_frequency
        const newMaxFreq = response.data.configurations.max_frequency

        
        deletePreviousTrackDurationInApp( previousAudioDuration ) // Remove outdated track duration of the previous file in the App component
        passTrackDurationToApp( trackDuration )
        passGlobalHopLengthToApp( hopLength )
        passGlobalNumSpecColumnsToApp( numSpecColumns )
        passGlobalSamplingRateToApp( samplingRate )
        passDefaultConfigToApp( defaultConfig )

        passResponseToScalableSpec( newResponseData )
        passSpecCalMethodToScalableSpec( newSpecCalMethod )
        passNfftToScalableSpec( newNfft ? newNfft : 512)
        passBinsPerOctaveToScalableSpec( newBinsPerOctave ? newBinsPerOctave : 0)
        passMinFreqToScalableSpec( newMinFreq ? newMinFreq : 0)
        passMaxFreqToScalableSpec( newMaxFreq ? newMaxFreq : 16000)
    }

    const handleUploadError = (error) => {
        passSpectrogramIsLoadingToScalableSpec( false )
        console.error("Error uploading file:", error)
        alert('Error while uploading. Check the console for more information.')
    }


    /* ++++++++++++++++++ Use Effect Hooks ++++++++++++++++++ */

    // When url parameter is added into the searchbar
                    /*
    useEffect( () => {
        let ignore = false

        const queryParams = new URLSearchParams(location.search)
        const audioUrl = queryParams.get('audio_url') ? decodeURIComponent(queryParams.get('audio_url')) : null
        const hopLength = queryParams.get('hop_length') ? Number(queryParams.get('hop_length')) : null
        const numSpecColumns = queryParams.get('num_spec_columns') ? Number(queryParams.get('num_spec_columns')) : null
        const samplingRate = queryParams.get('sampling_rate') ? Number(queryParams.get('sampling_rate')) : null
        const specCalMethod = queryParams.get('spec_cal_method')
        const nfft = queryParams.get('n_fft') ? Number(queryParams.get('n_fft')) : null
        const binsPerOctave = queryParams.get('bins_per_octave') ? Number(queryParams.get('bins_per_octave')) : null
        const minFreq = queryParams.get('min_frequency') ? Number(queryParams.get('min_frequency')) : null
        const maxFreq = queryParams.get('max_frequency') ? Number(queryParams.get('max_frequency')) : null

        const uploadFileByURL = async () => {
            passSpectrogramIsLoadingToScalableSpec( true )
            const path = import.meta.env.VITE_BACKEND_SERVICE_ADDRESS+'upload-by-url'
            const requestParameters = {
                audio_url: audioUrl,
                hop_length: hopLength,
                num_spec_columns: numSpecColumns,
                sampling_rate: samplingRate,
                spec_cal_method: specCalMethod,
                n_fft: nfft,
                bins_per_octave: binsPerOctave,
                min_frequency: minFreq,
                max_frequency: maxFreq
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
                     */
    return (
        <div>
            <input className='file-input' type="file" accept=".wav, .mp3" onChange={handleFileChange} />
        </div>
    )
}

export default FileUpload