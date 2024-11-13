import React from 'react';

const ModuleTitle = ({ text }) => {
  const containerStyle = {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'flex-start',
    position: 'relative',
  };

  const lineStyle = {
    height: '1px', // Thickness of the line
    backgroundColor: 'white', // Color of the line
    width: '50px', // Length of the line on each side
  };

  const textStyle = {
    fontWeight: 'bold',
    fontSize: '1em', // Adjust size as needed
    padding: '0 10px', // Space between the text and lines
    // position: 'relative',
    color: 'white', // Color of the text
  };

  return (
    <div style={containerStyle}>
      <span style={lineStyle}></span>
      <span style={textStyle}>{text}</span>
      <span style={lineStyle}></span>
    </div>
  );
};

export default ModuleTitle;
