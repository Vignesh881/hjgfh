/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */
import React from 'react';

// MoiBook Logo Component with Money Note + Open Book Design
const MoiBookLogo = ({ size = 60, variant = 'default', className = '' }) => {
  const containerStyle = {
    display: 'inline-flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    width: size,
    height: size,
    position: 'relative'
  };

  // Money note (top part) - Green with rupee symbol
  const moneyNoteStyle = {
    width: size * 0.65,
    height: size * 0.22,
    background: 'linear-gradient(135deg, #4CAF50 0%, #45a049 50%, #2E7D32 100%)',
    borderRadius: '3px',
    position: 'relative',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: size * 0.08,
    boxShadow: '0 2px 4px rgba(0,0,0,0.2)',
    transform: 'rotate(-8deg)',
    zIndex: 2,
    border: '1px solid #2E7D32'
  };

  const rupeeStyle = {
    color: 'white',
    fontSize: size * 0.12,
    fontWeight: 'bold',
    textShadow: '1px 1px 2px rgba(0,0,0,0.3)'
  };

  // Book (bottom part) - Blue open book
  const bookContainerStyle = {
    width: size * 0.75,
    height: size * 0.35,
    position: 'relative',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: size * 0.05
  };

  const bookPageLeftStyle = {
    width: size * 0.32,
    height: size * 0.32,
    background: variant === 'white' 
      ? 'linear-gradient(135deg, #e3f2fd 0%, #bbdefb 100%)'
      : 'linear-gradient(135deg, #1976D2 0%, #1565C0 100%)',
    borderTopLeftRadius: '4px',
    borderBottomLeftRadius: '4px',
    borderRight: `1px solid ${variant === 'white' ? '#90caf9' : '#0D47A1'}`,
    boxShadow: '0 2px 6px rgba(0,0,0,0.15)',
    transform: 'perspective(100px) rotateY(15deg)',
    transformOrigin: 'right center'
  };

  const bookPageRightStyle = {
    width: size * 0.32,
    height: size * 0.32,
    background: variant === 'white' 
      ? 'linear-gradient(135deg, #ffffff 0%, #f3e5f5 100%)'
      : 'linear-gradient(135deg, #2196F3 0%, #1976D2 100%)',
    borderTopRightRadius: '4px',
    borderBottomRightRadius: '4px',
    borderLeft: `1px solid ${variant === 'white' ? '#90caf9' : '#0D47A1'}`,
    boxShadow: '0 2px 6px rgba(0,0,0,0.15)',
    transform: 'perspective(100px) rotateY(-15deg)',
    transformOrigin: 'left center'
  };

  // Book spine/binding
  const bookSpineStyle = {
    width: '2px',
    height: size * 0.32,
    background: variant === 'white' ? '#1976D2' : '#0D47A1',
    position: 'absolute',
    zIndex: 1,
    boxShadow: '0 0 4px rgba(0,0,0,0.3)'
  };

  // Tamil text at bottom
  const tamilTextStyle = {
    color: '#4CAF50',
    fontFamily: "'Noto Sans Tamil', 'Latha', 'TAMu_Kadambri', Arial, sans-serif",
    fontSize: size * 0.18,
    fontWeight: 'bold',
    textShadow: '1px 1px 2px rgba(0,0,0,0.1)',
    whiteSpace: 'nowrap',
    marginTop: size * 0.02
  };

  return (
    <div style={containerStyle} className={className}>
      {/* Money Note with Rupee */}
      <div style={moneyNoteStyle}>
        <span style={rupeeStyle}>₹</span>
      </div>
      
      {/* Open Book */}
      <div style={bookContainerStyle}>
        <div style={bookPageLeftStyle}></div>
        <div style={bookSpineStyle}></div>
        <div style={bookPageRightStyle}></div>
      </div>
      
      {/* Tamil Text */}
      <div style={tamilTextStyle}>மொய்புக்</div>
    </div>
  );
};

// Icon version (just the symbol without text)
const MoiBookIcon = ({ size = 24, variant = 'default', className = '' }) => {
  return (
    <MoiBookLogo 
      size={size} 
      variant={variant} 
      className={className}
    />
  );
};

// Text version (just Tamil text)
const MoiBookText = ({ size = 'medium', variant = 'default', className = '' }) => {
  const textSizes = {
    small: '16px',
    medium: '20px',
    large: '28px',
    xlarge: '36px'
  };

  const textStyle = {
    color: variant === 'white' ? '#4CAF50' : '#4CAF50',
    fontFamily: "'Noto Sans Tamil', 'Latha', 'TAMu_Kadambri', Arial, sans-serif",
    fontSize: textSizes[size] || textSizes.medium,
    fontWeight: 'bold',
    textShadow: variant === 'white' ? 'none' : '1px 1px 2px rgba(0,0,0,0.1)',
    margin: 0,
    padding: 0
  };

  return (
    <span style={textStyle} className={className}>
      மொய்புக்
    </span>
  );
};

export default MoiBookLogo;
export { MoiBookIcon, MoiBookText };