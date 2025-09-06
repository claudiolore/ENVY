/**
 * Componente per la selezione della lingua
 * Mostra un menu a tendina con le lingue disponibili
 */

import React, { useState } from 'react';
import {
  FormControl,
  Select,
  MenuItem,
  Box,
  Typography,
  IconButton,
  Menu,
  ListItemIcon,
  ListItemText,
} from '@mui/material';
import { Language as LanguageIcon } from '@mui/icons-material';
import { useI18n } from '../context/I18nContext.jsx';

const LanguageSelector = ({ variant = 'menu' }) => {
  const { language, changeLanguage, getAvailableLanguages } = useI18n();
  const [anchorEl, setAnchorEl] = useState(null);
  const open = Boolean(anchorEl);

  const languages = getAvailableLanguages();
  const currentLanguage = languages.find(lang => lang.code === language);

  const handleClick = (event) => {
    if (variant === 'menu') {
      setAnchorEl(event.currentTarget);
    }
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const handleLanguageChange = (languageCode) => {
    changeLanguage(languageCode);
    if (variant === 'menu') {
      handleClose();
    }
  };

  // Versione con menu a tendina (per mobile/desktop)
  if (variant === 'menu') {
    return (
      <Box>
        <IconButton
          color="inherit"
          onClick={handleClick}
          aria-controls={open ? 'language-menu' : undefined}
          aria-haspopup="true"
          aria-expanded={open ? 'true' : undefined}
          sx={{ color: 'white' }}
        >
          <Box display="flex" alignItems="center" gap={1}>
            <Typography variant="body2" sx={{ fontSize: '1.2rem' }}>
              {currentLanguage?.flag}
            </Typography>
            <LanguageIcon />
          </Box>
        </IconButton>
        <Menu
          id="language-menu"
          anchorEl={anchorEl}
          open={open}
          onClose={handleClose}
          MenuListProps={{
            'aria-labelledby': 'language-button',
          }}
          transformOrigin={{ horizontal: 'right', vertical: 'top' }}
          anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
        >
          {languages.map((lang) => (
            <MenuItem
              key={lang.code}
              selected={lang.code === language}
              onClick={() => handleLanguageChange(lang.code)}
            >
              <ListItemIcon>
                <Typography sx={{ fontSize: '1.2rem' }}>
                  {lang.flag}
                </Typography>
              </ListItemIcon>
              <ListItemText primary={lang.name} />
            </MenuItem>
          ))}
        </Menu>
      </Box>
    );
  }

  // Versione con select (alternativa)
  return (
    <FormControl size="small" sx={{ minWidth: 100 }}>
      <Select
        value={language}
        onChange={(e) => handleLanguageChange(e.target.value)}
        displayEmpty
        sx={{
          color: 'white',
          '.MuiOutlinedInput-notchedOutline': {
            borderColor: 'rgba(255, 255, 255, 0.23)',
          },
          '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
            borderColor: 'rgba(255, 255, 255, 0.5)',
          },
          '&:hover .MuiOutlinedInput-notchedOutline': {
            borderColor: 'rgba(255, 255, 255, 0.5)',
          },
          '.MuiSvgIcon-root': {
            color: 'white',
          },
        }}
      >
        {languages.map((lang) => (
          <MenuItem key={lang.code} value={lang.code}>
            <Box display="flex" alignItems="center" gap={1}>
              <Typography sx={{ fontSize: '1.2rem' }}>
                {lang.flag}
              </Typography>
              <Typography>{lang.name}</Typography>
            </Box>
          </MenuItem>
        ))}
      </Select>
    </FormControl>
  );
};

export default LanguageSelector;
