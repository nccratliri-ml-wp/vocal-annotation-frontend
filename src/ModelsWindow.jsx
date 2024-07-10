import React, {useState} from "react";
import {toast} from "react-toastify";
import {ANNOTATED_AREA, UNKNOWN_CLUSTERNAME, UNKNOWN_INDIVIDUAL, UNKNOWN_SPECIES} from "./species.js";
import axios from "axios";
import {Label} from "./label.js";
import {nanoid} from "nanoid";
import LinearProgress from "@mui/material/LinearProgress";
import Box from "@mui/material/Box";
import {excludeNonDigits, excludeSpecialCharacters} from "./utils.js";

function ModelsWindow (
    {
        modelsAvailableForInference,
        modelsAvailableForFinetuning,
        modelsCurrentlyTrained,
        passShowModelsWindowToWhisperSeg,
        audioId,
        trackID,
        filename,
        minFreq,
        labels,
        speciesArray,
        passLabelsToScalableSpec,
        passWhisperSegIsLoadingToScalableSpec,
    }
){

    const [selectedInferenceModel, setSelectedInferenceModel] = useState('whisperseg-base')
    const [selectedFinetuningModel, setSelectedFinetuningModel] = useState('whisperseg-base')

    const [minFreqInput, setMinFreqInput] = useState(minFreq)
    const [newModelName, setNewModelName] = useState('')

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
                    onset: 1.2,
                    offset: 3.4,
                },
                {
                    onset: 4.2,
                    offset: 6.4,
                },
            ]
            */

            // Currently assign all labels returned by Whisper as Unknonw Species, Individual and Clustername, until Whisper support is implemented
            const unknownSpecies = speciesArray.find( species => species.name === UNKNOWN_SPECIES)
            const unknownIndividual = unknownSpecies.individuals.find( individual => individual.name === UNKNOWN_INDIVIDUAL)
            const unknownClustername = unknownSpecies.clusternames.find( clustername => clustername.name === UNKNOWN_CLUSTERNAME)

            const whisperLabels = whisperObjects.map( obj => {
                return new Label(
                    nanoid(),
                    trackID,
                    filename,
                    obj.onset,
                    obj.offset,
                    unknownSpecies.name,
                    unknownIndividual.name,
                    unknownClustername.name,
                    unknownSpecies.id,
                    unknownIndividual.id,
                    unknownClustername.id,
                    0,
                    'Whisper',
                    unknownClustername.color
                )
            })

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
            min_frequency: minFreqInput
        }

        try {
            await axios.post(path, requestParameters)
            toast.success('Custom model started training and will be available soon.')
        } catch (error){
            toast.error('Something went wrong with your request. Check the console to view the error.')
            console.error(error)
        }
    }

    return (
        <div id='models-window'>

            <div className='close-btn-container'>
                <button className='close-btn' onClick={() => passShowModelsWindowToWhisperSeg(false)}>✖</button>
                <p className='window-header'>WhisperSeg</p>
            </div>

            <div className='models-container'>
                <table className='models-table'>
                    <caption>Inference Models</caption>
                    <thead>
                    <tr>
                        <th className='models-table-header-1'>Model</th>
                        <th className='models-table-header-2'>Status</th>
                    </tr>
                    </thead>
                    <tbody>
                    {
                        modelsAvailableForInference && modelsAvailableForInference.map(model => {
                            if (model.status !== 'ready'){
                                return <></>
                            }
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
                                    <td className='models-table-cell'>{model.status}</td>
                                </tr>
                            )
                        })
                    }
                    </tbody>
                </table>
                <div className='models-buttons-container'>
                    <label>
                        Min Freq:
                        <input
                            type="number"
                            value={minFreqInput}
                            min={0}
                            onChange={ (event) => setMinFreqInput(event.target.value) }
                            onKeyPress={excludeNonDigits}
                            onFocus={(event) => event.target.select()}
                            onPaste={(event) => event.preventDefault()}
                        />
                    </label>
                    <button onClick={callWhisperSeg}>Call WhisperSeg</button>
                </div>
                {!modelsAvailableForInference && <Box sx={{width: '100%'}}><LinearProgress/></Box>}
            </div>

            <div className='models-container'>
                <table className='models-table'>
                    <caption>Finetune Models</caption>
                    <thead>
                    <tr>
                        <th className='models-table-header-1'>Model</th>
                        <th className='models-table-header-2'>Status</th>
                    </tr>
                    </thead>
                    <tbody>
                    {
                        modelsAvailableForFinetuning && modelsAvailableForFinetuning.map(model => {
                            if (model.status !== 'ready'){
                                return <></>
                            }
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
                                    <td>{model.status}</td>
                                </tr>
                            )
                        })
                    }
                    </tbody>
                </table>
                <div className='models-buttons-container'>
                    <form
                        onSubmit={handleClickSubmitTrainingRequestBtn}
                    >
                        <label>
                            New Model Name:
                            <input
                                type="text"
                                value={newModelName}
                                required='required'
                                pattern='^[a-zA-Z0-9\-_\.]+$'
                                title='Model name has to be composed of the following charcters: A-Z a-z 0-9 _ - .'
                                onChange={ (event) => setNewModelName(event.target.value) }
                                onFocus={(event) => event.target.select()}
                            />
                            <button>Submit Training Request</button>
                        </label>
                    </form>
                </div>
                {!modelsAvailableForFinetuning && <Box sx={{width: '100%'}}><LinearProgress/></Box>}
            </div>

            <div className='models-container'>
                <table className='models-table'>
                    <caption>Models in Training</caption>
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
                {!modelsCurrentlyTrained && <Box sx={{width: '100%'}}><LinearProgress/></Box>}
            </div>

            <button onClick={() => passShowModelsWindowToWhisperSeg(false)}>Cancel</button>


        </div>
    )
}

export default ModelsWindow