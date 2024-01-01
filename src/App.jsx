import {useState, useRef} from 'react'
import Clusternames from "./Clusternames.jsx"
import CSVReader from "./CSVReader.jsx"
import ScalableSpec from "./ScalableSpec.jsx";
import Searchbar from "./Searchbar.jsx"
import SpecType from "./SpecType.jsx";

function App() {
    const audioDOMObject = useRef(null)
    const [audioFileName, setAudioFileName] = useState(null)
    const [importedLabels, setImportedLabels] = useState([]);
    const [importedClusternameButtons, setImportedClusternameButtons] = useState([])
    const [activeClustername, setActiveClustername] = useState()
    const [specType, setSpecType] = useState('log-mel')
    const [nfft, setNfft] = useState(null)
    const [binsPerOctave, setBinsPerOctave] = useState(null)
    const [parameters, setParameters] = useState({})
    const [trackDurations, setTrackDurations] = useState([])


    function passLabelsToApp(newLabels){
        setImportedLabels( newLabels )
    }

    function passClusterNameButtonsToApp(newClusternameButtons){
        setImportedClusternameButtons( newClusternameButtons )
    }

    function passActiveClusternameToApp(chosenClustername){
        setActiveClustername( chosenClustername )
    }

    function passSpecTypeToApp(chosenSpecType){
        setSpecType( chosenSpecType )
    }

    function passNfftToApp( chosenNfft ){
        setNfft( chosenNfft )
    }

    function passBinsPerOctaveToApp ( binsPerOctave ){
        setBinsPerOctave (binsPerOctave)
    }

    function passParametersToApp (newParametersObject){
        setParameters( newParametersObject )
    }

    function passLongestTrackDurationToApp( newTrackDuration ){
        setTrackDurations( prevState => [...prevState, newTrackDuration])
    }

    function deleteOutdatedLongestTrackDurationInApp( outdatedLongestTrackDuration ) {
        const newTrackDurations = trackDurations.filter( trackDuration => trackDuration !== outdatedLongestTrackDuration)
        setTrackDurations( newTrackDurations )
    }

    return (
        <>
            <div id='files-upload-container'>
                <Searchbar />
                <audio preload="metadata" ref={audioDOMObject}></audio>
                <CSVReader
                    passLabelsToApp={passLabelsToApp}
                    passClusterNameButtonsToApp={passClusterNameButtonsToApp}
                />
                <SpecType
                    specType={specType}
                    passSpecTypeToApp={passSpecTypeToApp}
                    passNfftToApp={passNfftToApp}
                    passBinsPerOctaveToApp={passBinsPerOctaveToApp}
                />
                {/*
                <Parameters
                    parameters={parameters}
                    passParametersToApp={passParametersToApp}
                />
                */}
            </div>
            <ScalableSpec
                importedLabels={importedLabels}
                activeClustername={activeClustername}
                specType={specType}
                nfft={nfft}
                binsPerOctave={binsPerOctave}
                parameters={parameters}
                showOverviewInitialValue={true}
                longestTrackDuration={Math.max(...trackDurations)}
                passLongestTrackDurationToApp={passLongestTrackDurationToApp}
                deleteOutdatedLongestTrackDurationInApp={deleteOutdatedLongestTrackDurationInApp}
            />
            <ScalableSpec
                importedLabels={importedLabels}
                activeClustername={activeClustername}
                specType={specType}
                nfft={nfft}
                binsPerOctave={binsPerOctave}
                parameters={parameters}
                showOverviewInitialValue={false}
                longestTrackDuration={Math.max(...trackDurations)}
                passLongestTrackDurationToApp={passLongestTrackDurationToApp}
                deleteOutdatedLongestTrackDurationInApp={deleteOutdatedLongestTrackDurationInApp}
            />
            <ScalableSpec
                importedLabels={importedLabels}
                activeClustername={activeClustername}
                specType={specType}
                nfft={nfft}
                binsPerOctave={binsPerOctave}
                parameters={parameters}
                showOverviewInitialValue={false}
                longestTrackDuration={Math.max(...trackDurations)}
                passLongestTrackDurationToApp={passLongestTrackDurationToApp}
                deleteOutdatedLongestTrackDurationInApp={deleteOutdatedLongestTrackDurationInApp}
            />
            <Clusternames
                passActiveClusternameToApp={passActiveClusternameToApp}
                importedClusternameButtons={importedClusternameButtons}
                audioFileName={audioFileName}
            />

        </>
    )
}

export default App