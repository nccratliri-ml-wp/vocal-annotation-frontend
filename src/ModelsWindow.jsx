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
            passCurrentlyTrainedModelsNamesToWhisperSeg
        }
    )
{

    const [showInferenceTab, setShowInferenceTab] = useState(true)
    const [showFinetuningTab, setShowFinetuningTab] = useState(false)
    const [showTrainingTab, setShowTrainingTab] = useState(false)

    const [selectedInferenceModel, setSelectedInferenceModel] = useState('whisperseg-base')
    const [selectedFinetuningModel, setSelectedFinetuningModel] = useState('whisperseg-base')

    const [minFreqInput, setMinFreqInput] = useState(minFreq)
    const [minFreqFinetuneInput, setMinFreqFinetuneInput] = useState(minFreq)
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

    const callWhisperSeg = async() => {
        passWhisperSegIsLoadingToScalableSpec(true)
        const path = import.meta.env.VITE_BACKEND_SERVICE_ADDRESS+'get-labels'

        const annotatedAreas = filterAndConvertAnnotatedAreasForWhisper()
        const convertedLabels = filterAndConvertLabelsForWhisper()

        const requestParameters = {
            audio_id: audioId,
            annotated_areas: annotatedAreas,
            human_labels: convertedLabels,
            model_name: selectedInferenceModel,
            min_frequency: minFreqInput
        }

        try {
            const response = await axios.post(path, requestParameters)
            const whisperObjects = response.data.labels

            /*
            const whisperObjects = [
                {
                    clustername: 'Unknown',
                    individual: 'Unknown',
                    species: 'Unknown',
                    onset: 1.2,
                    offset: 3.4,
                },
                {
                    clustername: 'Hungry call',
                    individual: 'Bob',
                    species: 'Unknown',
                    onset: 5.2,
                    offset: 6.0,
                },
                {
                    clustername: 'Hungry call',
                    individual: 'Bob',
                    species: 'Hamster',
                    onset: 4.2,
                    offset: 4.8,
                },
                {
                    clustername: 'Hungry call',
                    individual: 'Bob',
                    species: 'Hamster',
                    onset: 0.2,
                    offset: 0.4,
                },
                {
                    clustername: 'Mating call',
                    individual: 'Jim',
                    species: 'Hamster',
                    onset: 4.9,
                    offset: 5.1,
                },
                {
                    clustername: 'Hello',
                    individual: 'Suzie',
                    species: 'Cat',
                    onset: 7.2,
                    offset: 7.8,
                },
            ]
            */

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
            toast.error('Something went wrong with your request. Check the console to view the error.')
            console.error(error)
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
        }

        const path= import.meta.env.VITE_BACKEND_SERVICE_ADDRESS+'finetune-whisperseg'

        const requestParameters = {
            audio_id: audioId,
            annotated_areas: annotatedAreas,
            human_labels: convertedLabels,
            new_model_name: newModelName,
            inital_model_name: selectedFinetuningModel,
            min_frequency: minFreqFinetuneInput
        }

        try {
            await axios.post(path, requestParameters)
            toast.success('Custom model started training and will be available soon.')
            const updatedArray = [...currentlyTrainedModelsNames, newModelName]
            passCurrentlyTrainedModelsNamesToWhisperSeg(updatedArray)
            setNewModelName('')

        } catch (error){
            toast.error('Something went wrong with your request. Check the console to view the error.')
            console.error(error)
        }
    }

    return (
        <div id='models-window'>

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
                {modelsAreLoading && <Box sx={{width: '100%'}}><LinearProgress/></Box>}
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
                                        <td className='models-table-cell'>
                                            <label>
                                                <input
                                                    type="radio"
                                                    name="inferenceModel"
                                                    disabled={model.status !== 'ready'}
                                                    checked={selectedInferenceModel === model.model_name}
                                                    onChange={() => setSelectedInferenceModel(model.model_name)}
                                                />
                                                {model.model_name}
                                            </label>
                                        </td>
                                        <td className='models-table-cell'>{model.eta === '--:--:--' ? '' : model.eta}</td>
                                        <td className='models-table-cell'>{model.status}</td>
                                    </tr>
                                )
                            })
                        }
                        </tbody>
                    </table>
                    <div className='inference-models-buttons-container'>
                        <label>
                            Min Freq:
                            <input
                                type="number"
                                value={minFreqInput}
                                min={0}
                                onChange={(event) => setMinFreqInput(event.target.value)}
                                onKeyPress={excludeNonDigits}
                                onFocus={(event) => event.target.select()}
                                onPaste={(event) => event.preventDefault()}
                            />
                        </label>
                        <button onClick={callWhisperSeg}>Call WhisperSeg</button>
                    </div>
                </div>
            }

            {showFinetuningTab &&
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
                            modelsAvailableForFinetuning && modelsAvailableForFinetuning.map(model => {
                                return (
                                    <tr key={nanoid()}>
                                        <td>
                                            <label>
                                                <input
                                                    type="radio"
                                                    name="finetuningModel"
                                                    checked={selectedFinetuningModel === model.model_name}
                                                    onChange={() => setSelectedFinetuningModel(model.model_name)}
                                                />
                                                {model.model_name}
                                            </label>
                                        </td>
                                        <td className='models-table-cell'>{model.eta === '--:--:--' ? '' : model.eta}</td>
                                        <td>{model.status}</td>
                                    </tr>
                                )
                            })
                        }
                        </tbody>
                    </table>
                    <form
                        onSubmit={handleClickSubmitTrainingRequestBtn}
                    >
                        <label className='finetuning-label'>
                            <div className='finetuning-models-inputs-container'>
                                <div>
                                    New Model Name:
                                    <input
                                        type="text"
                                        value={newModelName}
                                        required='required'
                                        pattern='^[a-zA-Z0-9\-_\.]+$'
                                        title='Model name has to be composed of the following charcters: A-Z a-z 0-9 _ - .'
                                        onChange={(event) => setNewModelName(event.target.value)}
                                        onFocus={(event) => event.target.select()}
                                    />
                                </div>
                                <div>
                                    Min Freq:
                                    <input
                                        type="number"
                                        value={minFreqFinetuneInput}
                                        min={0}
                                        onChange={(event) => setMinFreqFinetuneInput(event.target.value)}
                                        onKeyPress={excludeNonDigits}
                                        onFocus={(event) => event.target.select()}
                                        onPaste={(event) => event.preventDefault()}
                                    />
                                </div>
                            </div>
                            <button>Submit Training Request</button>
                        </label>
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
                                <td>{model.model_name}</td>
                                <td>{model.eta}</td>
                                <td>{model.status}</td>
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