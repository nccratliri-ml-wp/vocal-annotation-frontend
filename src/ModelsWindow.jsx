import React, {useState} from "react";
import {toast} from "react-toastify";
import {ANNOTATED_AREA, createSpeciesFromImportedLabels} from "./species.js";
import axios from "axios";
import {nanoid} from "nanoid";
import LinearProgress from "@mui/material/LinearProgress";
import Box from "@mui/material/Box";
import {excludeNonDigits} from "./utils.js";

function ModelsWindow (
        {
            modelsAreLoading,
            modelsAvailableForInference,
            modelsAvailableForFinetuning,
            selectedInferenceModel,
            selectedFinetuningModel,
            passSelectedInferenceModelToWhisperSeg,
            passSelectedFinetuningModelModelToWhisperSeg,
            modelsCurrentlyTrained,
            passShowModelsWindowToWhisperSeg,
            audioId,
            minFreq,
            labels,
            speciesArray,
            passLabelsToScalableSpec,
            passWhisperSegIsLoadingToScalableSpec,
            passSpeciesArrayToApp,
            assignSpeciesInformationToImportedLabels,
            currentlyTrainedModelsNames,
            passCurrentlyTrainedModelsNamesToWhisperSeg,
            tokenInference,
            tokenFinetune,
            passTokenInferenceToWhisperSeg,
            passTokenFinetuneToWhisperSeg
        }
    )
{

    const [showInferenceTab, setShowInferenceTab] = useState(true)
    const [showFinetuningTab, setShowFinetuningTab] = useState(false)
    const [showTrainingTab, setShowTrainingTab] = useState(false)

    const [minFreqInference, setMinFreqInference] = useState(minFreq)
    const [minFreqFinetune, setMinFreqFinetune] = useState(minFreq)
    const [newModelName, setNewModelName] = useState('')

    const handleClickInferenceTab = () => {
        setShowInferenceTab(true)
        setShowFinetuningTab(false)
        setShowTrainingTab(false)
    }

    const handleClickFinetuningTab = () => {
        setShowInferenceTab(false)
        setShowFinetuningTab(true)
        setShowTrainingTab(false)
    }

    const handleClickTrainingTab = () => {
        setShowInferenceTab(false)
        setShowFinetuningTab(false)
        setShowTrainingTab(true)
    }

    const filterAndConvertLabelsForWhisper = () => {
        // Remove the Annotated Area labels from labels
        let newLabelsArray = labels.filter( label => label.species !== ANNOTATED_AREA )

        // Convert custom label objects into generic objects with the specific data that is needed for Whisper
        return newLabelsArray.map( label => {
                return {
                    onset: label.onset,
                    offset: label.offset,
                    species: label.species,
                    individual: label.individual,
                    clustername: label.clustername,
                    speciesID: label.speciesID,
                    individualID: label.individualID,
                    clusternameID: label.clusternameID,
                    filename: label.filename,
                    trackID: label.trackID,
                }
            }
        )
    }

    const filterAndConvertAnnotatedAreasForWhisper = () => {
        // Extract annotated areas from the labels array
        return labels.reduce( (acc, label) => {
            if (label.species === ANNOTATED_AREA) {
                acc.push({
                    onset: label.onset,
                    offset: label.offset
                })
                return acc
            }
            return acc
        }, [])
    }

    const callWhisperSeg = async (event) => {
        event.preventDefault()

        passWhisperSegIsLoadingToScalableSpec(true)
        const path = import.meta.env.VITE_BACKEND_SERVICE_ADDRESS+'get-labels'

        const annotatedAreas = filterAndConvertAnnotatedAreasForWhisper()
        const convertedLabels = filterAndConvertLabelsForWhisper()

        const requestParameters = {
            audio_id: audioId,
            annotated_areas: annotatedAreas,
            human_labels: convertedLabels,
            model_name: selectedInferenceModel,
            min_frequency: minFreqInference,
            token: tokenInference
        }

        try {
            const response = await axios.post(path, requestParameters)
            const whisperObjects = response.data.labels

            // Create new species, Individuals and Clusternames in the Species panel from the whisper labels
            const updatedSpeciesArray = createSpeciesFromImportedLabels(whisperObjects, speciesArray)
            passSpeciesArrayToApp(updatedSpeciesArray)

            // Assign Species Information to the new labels
            const whisperLabels = assignSpeciesInformationToImportedLabels(updatedSpeciesArray, whisperObjects)

            const annotatedAreaLabels = labels.filter( label => label.species === ANNOTATED_AREA)
            const combinedLabels = whisperLabels.concat(annotatedAreaLabels)
            passLabelsToScalableSpec(combinedLabels)
            passShowModelsWindowToWhisperSeg(false)
        } catch (error){
            if (error.response.status === 403){
                toast.error('Access to WhisperSeg denied due to incorrect access token.')
            } else {
                toast.error('Something went wrong with your request. Check the console to view the error.')
                console.error(error)
            }
        } finally {
            passWhisperSegIsLoadingToScalableSpec(false)
        }
    }

    const handleClickSubmitTrainingRequestBtn = async (event) => {
        event.preventDefault()

        const annotatedAreas = filterAndConvertAnnotatedAreasForWhisper()
        const convertedLabels = filterAndConvertLabelsForWhisper()

        const allModels = [...modelsAvailableForInference, ...modelsAvailableForFinetuning, ...modelsCurrentlyTrained]

        for (const model of allModels){
            if (model.model_name === newModelName) {
                toast.error(`Model with the name "${newModelName}" already exists.`)
                return
            }
        }

        if (!annotatedAreas.length || !convertedLabels.length){
            toast.error('Provide at least one annotated Area and one label to train the new model on.')
            return
        }

        const path= import.meta.env.VITE_BACKEND_SERVICE_ADDRESS+'finetune-whisperseg'

        const requestParameters = {
            audio_id: audioId,
            annotated_areas: annotatedAreas,
            human_labels: convertedLabels,
            new_model_name: newModelName,
            initial_model_name: selectedFinetuningModel,
            min_frequency: minFreqFinetune,
            token: tokenFinetune
        }

        try {
            await axios.post(path, requestParameters)
            toast.success('Custom model started training and will be available soon.')
            const updatedArray = [...currentlyTrainedModelsNames, newModelName]
            passCurrentlyTrainedModelsNamesToWhisperSeg(updatedArray)
            setNewModelName('')

        } catch (error){
            if (error.response.status === 403){
                toast.error('Access to WhisperSeg denied due to incorrect access token.')
            } else {
                toast.error('Something went wrong with your request. Check the console to view the error.')
                console.error(error)
            }
        }
    }

    return (
        <div className='models-window'>

            <div className='models-window-header'>
                <div className='close-btn-container'>
                    <button className='close-btn' onClick={() => passShowModelsWindowToWhisperSeg(false)}>✖</button>
                    <p className='window-header'>WhisperSeg</p>
                </div>

                <div className='models-header-tabs-container'>
                    <div
                        className={showInferenceTab ? 'models-header-tab-opened' : 'models-header-tab'}
                        onClick={handleClickInferenceTab}
                    >
                        Inference Models
                    </div>
                    <div
                        className={showFinetuningTab ? 'models-header-tab-opened' : 'models-header-tab'}
                        onClick={handleClickFinetuningTab}
                    >
                        Finetune Models
                    </div>
                    <div
                        className={showTrainingTab ? 'models-header-tab-opened' : 'models-header-tab'}
                        onClick={handleClickTrainingTab}
                    >
                        In Training
                    </div>
                </div>
                {modelsAreLoading ? <Box sx={{width: '100%'}}><LinearProgress/></Box> : <div style={{height: '4px'}}></div>}
            </div>

            {showInferenceTab &&
                <div className='models-container'>
                    <table className='models-table'>
                        <thead>
                        <tr>
                            <th className='models-table-header-1'>Model</th>
                            <th className='models-table-header-2'>ETA</th>
                            <th className='models-table-header-3'>Status</th>
                        </tr>
                        </thead>
                        <tbody>
                        {
                            modelsAvailableForInference && modelsAvailableForInference.map(model => {
                                return (
                                    <tr key={nanoid()}>
                                        <td className='cell1'>
                                            <label>
                                                <input
                                                    type="radio"
                                                    name="inferenceModel"
                                                    disabled={model.status !== 'ready'}
                                                    checked={selectedInferenceModel === model.model_name}
                                                    onChange={() => passSelectedInferenceModelToWhisperSeg(model.model_name)}
                                                />
                                                {model.model_name}
                                            </label>
                                        </td>
                                        <td className='cell2'>{model.eta === '--:--:--' ? '' : model.eta}</td>
                                        <td className='cell3'>{model.status}</td>
                                    </tr>
                                )
                            })
                        }
                        </tbody>
                    </table>
                    <form className='models-form' onSubmit={callWhisperSeg}>
                        <div className='models-form-input-fields'>
                            <label>
                                <div>Min Freq:</div>
                                <input
                                    className='models-window-input-field'
                                    type="number"
                                    value={minFreqInference}
                                    min={0}
                                    onChange={(event) => setMinFreqInference(event.target.value)}
                                    onKeyPress={excludeNonDigits}
                                    onFocus={(event) => event.target.select()}
                                    onPaste={(event) => event.preventDefault()}
                                />
                            </label>
                            <label>
                                <div>Access Token:</div>
                                <input
                                    className='models-window-input-field'
                                    type="text"
                                    value={tokenInference}
                                    onChange={(event) => passTokenInferenceToWhisperSeg(event.target.value)}
                                    onFocus={(event) => event.target.select()}
                                />
                            </label>
                        </div>
                        <button disabled={!modelsAvailableForInference}>Call WhisperSeg</button>
                    </form>
                </div>
            }

            {showFinetuningTab &&
                <div className='models-container'>
                    <table className='models-table'>
                        <thead >
                        <tr>
                            <th className='models-table-header-1'>Initial Checkpoint</th>
                            <th className='models-table-header-2'>ETA</th>
                            <th className='models-table-header-3'>Status</th>
                        </tr>
                        </thead>
                        <tbody className='models-table-body'>
                        {
                            modelsAvailableForFinetuning && modelsAvailableForFinetuning.map(model => {
                                return (
                                    <tr key={nanoid()}>
                                        <td className='cell1'>
                                            <label>
                                                <input
                                                    type="radio"
                                                    name="finetuningModel"
                                                    checked={selectedFinetuningModel === model.model_name}
                                                    onChange={() => passSelectedFinetuningModelModelToWhisperSeg(model.model_name)}
                                                />
                                                {model.model_name}
                                            </label>
                                        </td>
                                        <td className='cell2'>{model.eta === '--:--:--' ? '' : model.eta}</td>
                                        <td className='cell3'>{model.status}</td>
                                    </tr>
                                )
                            })
                        }
                        </tbody>
                    </table>

                    <form className='models-form' onSubmit={handleClickSubmitTrainingRequestBtn}>
                        <div className='models-form-input-fields'>
                            <label>
                                <div>New Model Name:</div>
                                <input
                                    className='models-window-input-field'
                                    type="text"
                                    value={newModelName}
                                    required='required'
                                    pattern='^[a-zA-Z0-9\-_\.]+$'
                                    title='Model name has to be composed of the following characters: A-Z a-z 0-9 _ - .'
                                    onChange={(event) => setNewModelName(event.target.value)}
                                    onFocus={(event) => event.target.select()}
                                />
                            </label>
                            <label>
                                <div>Min Freq:</div>
                                <input
                                    className='models-window-input-field'
                                    type="number"
                                    value={minFreqFinetune}
                                    min={0}
                                    onChange={(event) => setMinFreqFinetune(event.target.value)}
                                    onKeyPress={excludeNonDigits}
                                    onFocus={(event) => event.target.select()}
                                    onPaste={(event) => event.preventDefault()}
                                />
                            </label>
                            <label>
                                <div>Access Token:</div>
                                <input
                                    className='models-window-input-field'
                                    type="text"
                                    value={tokenFinetune}
                                    onChange={(event) => passTokenFinetuneToWhisperSeg(event.target.value)}
                                    onFocus={(event) => event.target.select()}
                                />
                            </label>
                        </div>
                        <button disabled={!modelsAvailableForFinetuning}>Submit Training Request</button>
                    </form>

                </div>
            }

            {showTrainingTab &&
                <div className='models-container'>
                    <table className='models-table'>
                        <thead>
                        <tr>
                            <th className='models-table-header-1'>Model</th>
                            <th className='models-table-header-2'>ETA</th>
                            <th className='models-table-header-3'>Status</th>
                        </tr>
                        </thead>
                        <tbody>
                        {modelsCurrentlyTrained && modelsCurrentlyTrained.map(model => (
                            <tr key={nanoid()}>
                                <td className='cell1'>{model.model_name}</td>
                                <td className='cell2'>{model.eta}</td>
                                <td className='cell3'>{model.status}</td>
                            </tr>
                        ))}
                        </tbody>
                    </table>
                </div>
            }

        </div>
    )
}

export default ModelsWindow