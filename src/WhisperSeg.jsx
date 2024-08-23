// React
import React, {useEffect, useState} from "react";

// External dependencies
import axios from "axios";
import {toast} from "react-toastify";
import Draggable from 'react-draggable';
import Tooltip from '@mui/material/Tooltip';
import IconButton from '@mui/material/IconButton';
import {iconBtnDisabled} from "./buttonStyles.js";
import AutoFixHighIcon from "@mui/icons-material/AutoFixHigh.js";

// Internal dependencies
import ModelsWindow from "./ModelsWindow.jsx";
import {useScroll} from "./ScrollContext.jsx";


function WhisperSeg(
        {
            audioId,
            minFreq,
            labels,
            speciesArray,
            passLabelsToTrack,
            passWhisperSegIsLoadingToTrack,
            activeIconBtnStyle,
            activeIcon,
            strictMode,
            passSpeciesArrayToApp,
            assignSpeciesInformationToImportedLabels,
            tokenInference,
            tokenFinetune,
            passTokenInferenceToWhisperSeg,
            passTokenFinetuneToWhisperSeg
        }
    )
{

    const [showModelsWindow, setShowModelsWindow] = useState(false)
    const [modelsAreLoading, setModelsAreLoading] = useState(false)
    const [modelsAvailableForFinetuning, setModelsAvailableForFinetuning] = useState()
    const [modelsAvailableForInference, setModelsAvailableForInference] = useState()
    const [modelsCurrentlyTrained, setModelsCurrentlyTrained] = useState()
    const [currentlyTrainedModelsNames, setCurrentlyTrainedModelsNames] = useState([])

    const [selectedInferenceModel, setSelectedInferenceModel] = useState('')
    const [selectedFinetuningModel, setSelectedFinetuningModel] = useState('')

    // Scroll Context
    const { setScrollEnabled } = useScroll()


    const passShowModelsWindowToWhisperSeg = ( boolean) => {
        setShowModelsWindow( boolean )
    }

    const passCurrentlyTrainedModelsNamesToWhisperSeg = ( updatedArray ) => {
        setCurrentlyTrainedModelsNames( updatedArray )
    }

    const passSelectedInferenceModelToWhisperSeg = ( selectedModel ) => {
        setSelectedInferenceModel( selectedModel )
    }

    const passSelectedFinetuningModelModelToWhisperSeg = ( selectedModel ) => {
        setSelectedFinetuningModel( selectedModel )
    }

    const handleClickWhisperSeg = () => {
        setShowModelsWindow(true)
    }

    const getAllModels = async () => {
        if (!showModelsWindow && currentlyTrainedModelsNames.length === 0) return

        setModelsAreLoading(true)

        try {
            const [inferenceModels, finetuneModels, currentlyTrainedModels] = await Promise.all([
                getModelsAvailableForInference(),
                getModelsAvailableForFinetuning(),
                getModelsCurrentlyTrained()
            ])

            setModelsAreLoading(false)
            setModelsAvailableForInference(inferenceModels)
            setModelsAvailableForFinetuning(finetuneModels)
            setModelsCurrentlyTrained(currentlyTrainedModels)

            setSelectedInferenceModel(inferenceModels[0].model_name)
            setSelectedFinetuningModel(finetuneModels[0].model_name)

        } catch (error) {
            toast.error('An error occurred trying to access the WhisperSeg API. Check the console for more information')
            console.error('Error fetching data:', error)
            setModelsAreLoading(false)
            setShowModelsWindow(false)
        }
    }

    const getModelsAvailableForInference = async () => {
        const path = import.meta.env.VITE_BACKEND_SERVICE_ADDRESS+'list-models-available-for-inference'

        try{
            const response = await axios.post(path, {}, {headers: {'Content-Type': 'application/json'}})
            return response.data.response
        } catch(error){
            toast.error('Something went wrong with your request. Check the console to view the error.')
            console.error(error)
        }
    }

    const getModelsAvailableForFinetuning = async () => {
        const path = import.meta.env.VITE_BACKEND_SERVICE_ADDRESS+'list-models-available-for-finetuning'

        try{
            const response = await axios.post(path, {}, {headers: {'Content-Type': 'application/json'}})
            return response.data.response
        } catch(error){
            toast.error('Something went wrong with your request. Check the console to view the error.')
            console.error(error)
        }
    }

    const getModelsCurrentlyTrained = async () => {
        const path = import.meta.env.VITE_BACKEND_SERVICE_ADDRESS+'list-models-training-in-progress'

        try{
            const response = await axios.post(path, {}, {headers: {'Content-Type': 'application/json'}})
            return response.data.response
        } catch(error){
            toast.error('Something went wrong with your request. Check the console to view the error.')
            console.error(error)
        }
    }


    /* ++++++++++++++++++ useEffect Hooks ++++++++++++++++++ */

    // When user clicks on CallWhisperSeg button
    useEffect(() => {
        // Get Models immediately
        getAllModels()

        // Set up an interval that will refresh the models every 10 seconds
        const interval = setInterval(() => {
            getAllModels()
        }, 10000)

        // Clean up the interval on component unmount
        return () => clearInterval(interval)
    }, [showModelsWindow])

    // When currently trained models change, check if a new model has finished training and display a pop-up
    useEffect( () => {
        if (!modelsCurrentlyTrained) return

        const allCurrentlyTrainedModelNames = modelsCurrentlyTrained.map(model => model.model_name)

        const updatedModelsInTrainingQueue = []

        for (const modelName of currentlyTrainedModelsNames){
            if (allCurrentlyTrainedModelNames.includes(modelName)){
                updatedModelsInTrainingQueue.push(modelName)
            } else {
                toast.success(`New custom model "${modelName}" has finished training!`)
            }
        }

        passCurrentlyTrainedModelsNamesToWhisperSeg(updatedModelsInTrainingQueue)

    }, [modelsCurrentlyTrained])

    // When input window is open, disable scrolling, so users can use the arrow keys inside the input fields
    useEffect(() => {
        if (showModelsWindow) {
            setScrollEnabled(false);
        } else {
            setScrollEnabled(true);
        }
    }, [showModelsWindow]);

    return (
        <>
            <Tooltip title="Call WhisperSeg">
                <IconButton
                    style={{...activeIconBtnStyle, ...((strictMode || !audioId) && iconBtnDisabled)}}
                    disabled={strictMode || !audioId}
                    onClick={handleClickWhisperSeg}
                >
                    <AutoFixHighIcon style={activeIcon}/>
                </IconButton>
            </Tooltip>

            {showModelsWindow &&
                <Draggable cancel='.models-container'>
                    <div className="draggable-container-models-window">
                        <ModelsWindow
                            modelsAreLoading={modelsAreLoading}
                            modelsAvailableForInference={modelsAvailableForInference}
                            modelsAvailableForFinetuning={modelsAvailableForFinetuning}
                            selectedInferenceModel={selectedInferenceModel}
                            selectedFinetuningModel={selectedFinetuningModel}
                            passSelectedInferenceModelToWhisperSeg={passSelectedInferenceModelToWhisperSeg}
                            passSelectedFinetuningModelModelToWhisperSeg={passSelectedFinetuningModelModelToWhisperSeg}
                            modelsCurrentlyTrained={modelsCurrentlyTrained}
                            passShowModelsWindowToWhisperSeg={passShowModelsWindowToWhisperSeg}
                            audioId={audioId}
                            minFreq={minFreq}
                            labels={labels}
                            speciesArray={speciesArray}
                            passLabelsToTrack={passLabelsToTrack}
                            passWhisperSegIsLoadingToTrack={passWhisperSegIsLoadingToTrack}
                            passSpeciesArrayToApp={passSpeciesArrayToApp}
                            assignSpeciesInformationToImportedLabels={assignSpeciesInformationToImportedLabels}
                            currentlyTrainedModelsNames={currentlyTrainedModelsNames}
                            passCurrentlyTrainedModelsNamesToWhisperSeg={passCurrentlyTrainedModelsNamesToWhisperSeg}
                            tokenInference={tokenInference}
                            tokenFinetune={tokenFinetune}
                            passTokenInferenceToWhisperSeg={passTokenInferenceToWhisperSeg}
                            passTokenFinetuneToWhisperSeg={passTokenFinetuneToWhisperSeg}
                        />
                    </div>
                </Draggable>
            }
        </>
    )
}

export default WhisperSeg