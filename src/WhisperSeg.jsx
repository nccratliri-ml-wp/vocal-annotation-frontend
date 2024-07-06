import {ANNOTATED_AREA, UNKNOWN_CLUSTERNAME, UNKNOWN_INDIVIDUAL, UNKNOWN_SPECIES} from "./species.js";
import axios from "axios";
import {Label} from "./label.js";
import {nanoid} from "nanoid";
import IconButton from "@material-ui/core/IconButton";
import {iconBtnDisabled} from "./styles.js";
import AutoFixHighIcon from "@mui/icons-material/AutoFixHigh.js";
import Tooltip from "@material-ui/core/Tooltip";
import React from "react";

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

    const callWhisperSeg = async () => {
        passWhisperSegIsLoadingToScalableSpec(true)
        const path = import.meta.env.VITE_BACKEND_SERVICE_ADDRESS+'get-labels'

        // Extract annotated areas from the labels array
        const annotatedAreas = labels.reduce( (acc, label) => {
            if (label.species === ANNOTATED_AREA) {
                acc.push({
                    annotatedAreaStarTime: label.onset,
                    annotatedAreaEndTime: label.offset
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
            human_labels: newLabelsArray
        }

        const response = await axios.post(path, requestParameters)

        const whisperObjects = response.data.labels

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

        const combinedLabelsArray = labels.concat(whisperLabels)
        passLabelsToScalableSpec(combinedLabelsArray)
        passWhisperSegIsLoadingToScalableSpec(false)
    }

    return (
        <Tooltip title="Call WhisperSeg">
            <IconButton
                style={{...activeIconBtnStyle, ...(strictMode || !audioId && iconBtnDisabled)}}
                disabled={strictMode || !audioId}
                onClick={callWhisperSeg}
            >
                <AutoFixHighIcon style={activeIcon}/>
            </IconButton>
         </Tooltip>
    )
}

export default WhisperSeg