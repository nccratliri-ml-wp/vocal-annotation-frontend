import React, { useState, useRef } from 'react';
import axios from 'axios';
import { styled } from '@mui/material/styles';
import Button from '@mui/material/Button';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';
import Tooltip from '@material-ui/core/Tooltip';

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

    const [fileName, setFileName] = useState('')

    const handleFileChange = (event) => {
        const file = event.target.files[0]
        if (file && (file.type === 'audio/wav' || file.type === 'audio/mp3' || file.type === 'audio/mpeg')) {
            passSpectrogramIsLoadingToScalableSpec(true)
            setFileName(file.name)
            createFormData(file)
        }
    }

    const createFormData = (file) => {
        if (!file) return;
        const formData = new FormData();
        formData.append('newAudioFile', file);
        formData.append('spec_cal_method', specCalMethod);
        formData.append('n_fft', nfft);
        formData.append('bins_per_octave', binsPerOctave);
        formData.append('min_frequency', minFreq);
        formData.append('max_frequency', maxFreq);
        uploadLocalFile(formData);
    }

    const uploadLocalFile = async (formData) => {
        const path = import.meta.env.VITE_BACKEND_SERVICE_ADDRESS + 'upload'
        try {
            const response = await axios.post(path, formData)
            handleUploadResponse(response)
        } catch (error) {
            handleUploadError(error)
        }
    }

    const VisuallyHiddenInput = styled('input')({
        clip: 'rect(0 0 0 0)',
        clipPath: 'inset(50%)',
        height: 1,
        overflow: 'hidden',
        position: 'absolute',
        bottom: 0,
        left: 0,
        whiteSpace: 'nowrap',
        width: 1,
    });

    const ButtonText = styled('span')({
        maxWidth: '160px',
        whiteSpace: 'nowrap',
        overflow: 'hidden',
        textOverflow: 'ellipsis',
    })

    return (
        <Tooltip title={fileName? fileName : ''}>
            <Button
                component='label'
                role={undefined}
                variant='contained'
                tabIndex={-1}
                startIcon={fileName? '' : <CloudUploadIcon />}
                style={{display: 'flex', justifyContent: 'flex-start', overflow: 'hidden', textTransform: 'none'}}
            >
                <ButtonText>{fileName ? fileName : "UPLOAD FILE"}</ButtonText>
                <VisuallyHiddenInput type='file' accept='.wav, .mp3' onChange={handleFileChange} />
            </Button>
        </Tooltip>
    );
}

export default LocalFileUpload;
