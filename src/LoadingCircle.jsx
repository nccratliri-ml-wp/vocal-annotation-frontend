import React from 'react';
import CircularProgress from '@mui/material/CircularProgress';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';

const LoadingCircle = ({ progress }) => {
    return (
        <Box
            position="fixed"
            top={0}
            left={0}
            width="100vw"
            height="100vh"
            display="flex"
            flexDirection="column"
            alignItems="center"
            justifyContent="center"
            bgcolor="rgba(0, 0, 0, 0.5)"
            zIndex="tooltip" // Ensure it appears above other content
        >
            <Box position="relative" display="inline-flex">
                <CircularProgress variant="determinate" value={progress} />
                <Box
                    top={0}
                    left={0}
                    bottom={0}
                    right={0}
                    position="absolute"
                    display="flex"
                    alignItems="center"
                    justifyContent="center"
                >
                    <Typography variant="caption" component="div" sx={{ color: 'white' }}>
                        {`${Math.ceil(progress)}%`}
                    </Typography>
                </Box>
            </Box>
            <div style={{whiteSpace: 'nowrap'}}>{progress < 100 ? 'Loading Audio...' : 'Computing Spectrograms...'}</div>
        </Box>
    );
};

export default LoadingCircle;
