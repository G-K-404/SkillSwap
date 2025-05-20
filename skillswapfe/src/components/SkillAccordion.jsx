import React from 'react';
import {
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Typography,
  List,
  ListItem,
  ListItemText
} from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';

const SkillAccordion = ({ title, items }) => (
  <Accordion
    sx={{
      bgcolor: '#2c2c2c',
      color: 'white',
      border: '1px solid #00FF9F',
      boxShadow: '0 0 8px #00FF9F',
      marginBottom: '10px'
    }}
  >
    <AccordionSummary expandIcon={<ExpandMoreIcon sx={{ color: '#00FF9F' }} />}>
      <Typography sx={{ color: '#00FF9F', fontWeight: 'bold' }}>{title}</Typography>
    </AccordionSummary>
    <AccordionDetails>
      <List dense>
        {items.map((skill, i) => (
          <ListItem key={i} disablePadding>
            <ListItemText
              primary={skill}
              sx={{
                color: 'wheat',
                paddingLeft: '8px',
                '& .MuiTypography-root': { color: 'wheat' }
              }}
            />
          </ListItem>
        ))}
      </List>
    </AccordionDetails>
  </Accordion>
);

export default SkillAccordion;
