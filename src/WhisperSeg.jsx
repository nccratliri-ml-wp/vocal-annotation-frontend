import IconButton from "@material-ui/core/IconButton";
import {iconBtnDisabled} from "./styles.js";
import AutoFixHighIcon from "@mui/icons-material/AutoFixHigh.js";
import Tooltip from "@material-ui/core/Tooltip";
import React, {useState} from "react";
import ModelsWindow from "./ModelsWindow.jsx";

function WhisperSeg(
        {
            audioId,
            trackID,
            filename,
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

    const [showFinetuningModelsWindow, setShowFinetuningModelsWindow] = useState(false)
    const [modelsAvailableForFinetuning, setModelsAvailableForFinetuning] = useState()
    const [showInferenceModelsWindow, setShowInferenceModelsWindow] = useState(false)
    const [modelsAvailableForInference, setModelsAvailableForInference] = useState()

    const passShowFinetuningModelsWindowToWhisperSeg = ( boolean) => {
        setShowFinetuningModelsWindow( boolean )
    }

    const passShowInferenceModelsWindowToWhisperSeg = ( boolean) => {
        setShowInferenceModelsWindow( boolean )
    }

    const getModelsAvailableForFinetuning = async () => {
        const path = import.meta.env.VITE_BACKEND_SERVICE_ADDRESS+'list-models-available-for-finetuning'

        /*
        const response = await axios.post(path, {}, {
            headers: {
                'Content-Type': 'application/json'
            }
        })*/

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

        setModelsAvailableForFinetuning(placeholder.response)
        setShowFinetuningModelsWindow(true)
    }

    const getModelsAvailableForInference = async () => {
        const path = import.meta.env.VITE_BACKEND_SERVICE_ADDRESS+'list-models-available-for-inference'
        /*
        const response = await axios.post(path, {}, {
            headers: {
                'Content-Type': 'application/json'
            }
        })*/

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

        setModelsAvailableForInference(placeholder.response)
        setShowInferenceModelsWindow(true)
    }

    return (
        <>
            <Tooltip title="Call WhisperSeg">
                <IconButton
                    style={{...activeIconBtnStyle, ...(strictMode || !audioId && iconBtnDisabled)}}
                    disabled={strictMode || !audioId}
                    onClick={getModelsAvailableForInference}
                >
                    <AutoFixHighIcon style={activeIcon}/>
                </IconButton>
            </Tooltip>

            {showFinetuningModelsWindow &&
                <ModelsWindow
                    modelsAvailableForFinetuning={modelsAvailableForFinetuning}
                    passShowFinetuningModelsWindowToWhisperSeg={passShowFinetuningModelsWindowToWhisperSeg}
                />
            }

            {showInferenceModelsWindow &&
                <ModelsWindow
                    models={modelsAvailableForInference}
                    showWindow={passShowInferenceModelsWindowToWhisperSeg}
                    audioId={audioId}
                    trackID={trackID}
                    filename={filename}
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