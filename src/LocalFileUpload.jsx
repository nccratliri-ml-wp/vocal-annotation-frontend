import React from "react";
import axios from "axios";

function LocalFileUpload(
                        {
                            specCalMethod,
                            nfft,
                            binsPerOctave,
                            minFreq,
                            maxFreq,
                            passSpectrogramIsLoadingToScalableSpec,
                            handleUploadResponse,
                            handleUploadError
                        }
                    )
                {

    const handleFileChange = (event) => {
        const file = event.target.files[0];
        if (file && (file.type === 'audio/wav' || file.type === 'audio/mp3' || file.type === 'audio/mpeg')) {
            passSpectrogramIsLoadingToScalableSpec( true )
            createFormData(file)
        }
    }

    const createFormData = ( file ) => {
        if (!file) return
        const formData = new FormData();
        formData.append('newAudioFile', file)
        formData.append('spec_cal_method', specCalMethod)
        formData.append('n_fft', nfft)
        formData.append('bins_per_octave', binsPerOctave)
        formData.append('min_frequency', minFreq)
        formData.append('max_frequency', maxFreq)
        uploadLocalFile( formData )
    }

    const uploadLocalFile = async (formData) => {
        const path = import.meta.env.VITE_BACKEND_SERVICE_ADDRESS+'upload'
        try {
            const response = await axios.post(path, formData)
            handleUploadResponse(response)
        } catch (error) {
            handleUploadError(error)
        }
    }

    return (
        <div>
            <input className='file-input' type="file" accept=".wav, .mp3" onChange={handleFileChange} />
        </div>
    )
}

export default LocalFileUpload