import React, {useState} from "react";
import {toast} from "react-toastify";
import {ANNOTATED_AREA, UNKNOWN_CLUSTERNAME, UNKNOWN_INDIVIDUAL, UNKNOWN_SPECIES} from "./species.js";
import axios from "axios";
import {Label} from "./label.js";
import {nanoid} from "nanoid";

function ModelsWindow (
    {
        models,
        showWindow,
        audioId,
        trackID,
        filename,
        labels,
        speciesArray,
        passLabelsToScalableSpec,
        passWhisperSegIsLoadingToScalableSpec
    }
){

    const [selectedModel, setSelectedModel] = useState('whisperseg-base')

    const callWhisperSeg = async() => {
        passWhisperSegIsLoadingToScalableSpec(true)
        const path = import.meta.env.VITE_BACKEND_SERVICE_ADDRESS+'get-labels'

        // Extract annotated areas from the labels array
        const annotatedAreas = labels.reduce( (acc, label) => {
            if (label.species === ANNOTATED_AREA) {
                acc.push({
                    onset: label.onset,
                    offset: label.offset
                })
                return acc
            }
            return acc
        }, [])


        // Remove the Annotated Area labels from labels
        let newLabelsArray = labels.filter( label => label.species !== ANNOTATED_AREA )

        // Convert custom label objects into generic objects with the specific data that is needed for Whisper
        newLabelsArray = newLabelsArray.map( label => {
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

        const requestParameters = {
            audio_id: audioId,
            annotated_areas: annotatedAreas,
            human_labels: newLabelsArray,
            model_name: "whisperseg-base",
            min_frequency: 0
        }

        //const response = await axios.post(path, requestParameters)

        //const whisperObjects = response.data.labels

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
        passWhisperSegIsLoadingToScalableSpec(false)
        showWindow(false)
    }

    return (
        <div id='models-window'>

            <div className='close-btn-container'>
                <button className='close-btn' onClick={() => showWindow(false)}>✖</button>
                <p className='window-header'>WhisperSeg</p>
            </div>

            <div id='models-container'>
                <table>
                    <caption>Inference Models</caption>
                    <thead>
                    <tr>
                        <th className='models-table-header'>Model</th>
                        <th className='models-table-header'>ETA</th>
                        <th className='models-table-header'>Status</th>
                    </tr>
                    </thead>
                    <tbody>
                    {models.map( model => (
                        <tr key={nanoid()}>
                            <td>
                                <label>
                                    <input
                                        type="radio"
                                        name="model"
                                        checked={selectedModel === model.model_name}
                                        onChange={() => setSelectedModel(model.model_name)}
                                    />
                                    {model.model_name}
                                </label>
                            </td>
                            <td>{model.eta}</td>
                            <td>{model.status}</td>
                        </tr>
                    ))}
                    </tbody>
                </table>
            </div>

            <div id='models-buttons-container'>
                <button onClick={() => showWindow(false)}>Cancel</button>
                <button onClick={callWhisperSeg}>Call WhisperSeg</button>
            </div>


        </div>
    )
}

export default ModelsWindow