import IconButton from "@material-ui/core/IconButton";
import {iconBtnDisabled} from "./styles.js";
import AutoFixHighIcon from "@mui/icons-material/AutoFixHigh.js";
import Tooltip from "@material-ui/core/Tooltip";
import React, {useState} from "react";
import ModelsWindow from "./ModelsWindow.jsx";
import axios from "axios";
import {toast} from "react-toastify";

function WhisperSeg(
        {
            audioId,
            trackID,
            filename,
            minFreq,
            labels,
            speciesArray,
            passLabelsToScalableSpec,
            passWhisperSegIsLoadingToScalableSpec,
            activeIconBtnStyle,
            activeIcon,
            strictMode
        }
    )
{

    const [showModelsWindow, setShowModelsWindow] = useState(false)
    const [modelsAvailableForFinetuning, setModelsAvailableForFinetuning] = useState()
    const [modelsAvailableForInference, setModelsAvailableForInference] = useState()
    const [modelsCurrentlyTrained, setModelsCurrentlyTrained] = useState()

    const passShowModelsWindowToWhisperSeg = ( boolean) => {
        setShowModelsWindow( boolean )
    }


    const getAllModels = async () => {
        setShowModelsWindow(true)

        try {
            const [inferenceModels, finetuneModels, currentlyTrainedModels] = await Promise.all([
                getModelsAvailableForInference(),
                getModelsAvailableForFinetuning(),
                getModelsCurrentlyTrained()
            ])

            setModelsAvailableForInference(inferenceModels)
            setModelsAvailableForFinetuning(finetuneModels)
            setModelsCurrentlyTrained(currentlyTrainedModels)

        } catch (error) {
            toast.error('An error occurred trying to access the WhisperSeg API. Check the console for more information')
            console.error('Error fetching data:', error)
            setShowModelsWindow(false)
        }
    }

    const getModelsAvailableForInference = async () => {
        const path = import.meta.env.VITE_BACKEND_SERVICE_ADDRESS+'list-models-available-for-inference'

        const response = await axios.post(path, {}, {
            headers: {
                'Content-Type': 'application/json'
            }
        })

        const placeholder = {'response': [{'eta': '00:23:32',
                'model_name': 'whisperseg-base',
                'status': 'In progress'},
                {'eta': '--:--:--', 'model_name': 'whisperseg-large', 'status': 'ready'},
                {'eta': '--:--:--',
                    'model_name': 'r3428-99dph-whisperseg_base',
                    'status': 'ready'},
                {'eta': '--:--:--',
                    'model_name': 'r3428-99dph-whisperseg-base-v2.0',
                    'status': 'ready'},
                {'eta': '--:--:--',
                    'model_name': 'r3428-99dph-whisperseg-large',
                    'status': 'ready'},
                {'eta': '--:--:--',
                    'model_name': 'new-whisperseg-bengalese-finch',
                    'status': 'ready'}]}

        return response.data.response
        //return placeholder.response
    }

    const getModelsAvailableForFinetuning = async () => {
        const path = import.meta.env.VITE_BACKEND_SERVICE_ADDRESS+'list-models-available-for-finetuning'


        const response = await axios.post(path, {}, {
            headers: {
                'Content-Type': 'application/json'
            }
        })


        const placeholder = {'response': [{'eta': '--:--:--',
                'model_name': 'whisperseg-base',
                'status': 'ready'},
                {'eta': '--:--:--', 'model_name': 'whisperseg-large', 'status': 'ready'},
                {'eta': '--:--:--',
                    'model_name': 'r3428-99dph-whisperseg_base',
                    'status': 'ready'},
                {'eta': '--:--:--',
                    'model_name': 'r3428-99dph-whisperseg-base-v2.0',
                    'status': 'ready'},
                {'eta': '--:--:--',
                    'model_name': 'r3428-99dph-whisperseg-large',
                    'status': 'ready'},
                {'eta': '--:--:--',
                    'model_name': 'new-whisperseg-bengalese-finch',
                    'status': 'ready'}]}

        return response.data.response
    }

    const getModelsCurrentlyTrained = async () => {
        const path = import.meta.env.VITE_BACKEND_SERVICE_ADDRESS+'list-models-training-in-progress'

        const response = await axios.post(path, {}, {
            headers: {
                'Content-Type': 'application/json'
            }
        })

        return response.data.response
    }

    return (
        <>
            <Tooltip title="Call WhisperSeg">
                <IconButton
                    style={{...activeIconBtnStyle, ...(strictMode || !audioId && iconBtnDisabled)}}
                    disabled={strictMode || !audioId}
                    onClick={getAllModels}
                >
                    <AutoFixHighIcon style={activeIcon}/>
                </IconButton>
            </Tooltip>


            {showModelsWindow &&
                <ModelsWindow
                    modelsAvailableForInference={modelsAvailableForInference}
                    modelsAvailableForFinetuning={modelsAvailableForFinetuning}
                    modelsCurrentlyTrained={modelsCurrentlyTrained}
                    passShowModelsWindowToWhisperSeg={passShowModelsWindowToWhisperSeg}
                    audioId={audioId}
                    trackID={trackID}
                    filename={filename}
                    minFreq={minFreq}
                    labels={labels}
                    speciesArray={speciesArray}
                    passLabelsToScalableSpec={passLabelsToScalableSpec}
                    passWhisperSegIsLoadingToScalableSpec={passWhisperSegIsLoadingToScalableSpec}
                />
            }

        </>

    )
}

export default WhisperSeg