import React from 'react';
import { compose } from 'redux';
import { withStyles } from '@material-ui/core/styles';
import openNewWindow from '../fe-utils/windowUtil';
import AppBar from '@material-ui/core/AppBar';
import IconButton from '@material-ui/core/IconButton';
import Toolbar from '@material-ui/core/Toolbar';
import Typography from '@material-ui/core/Typography';
import ColorLens from '@material-ui/icons/ColorLens';
import Person from '@material-ui/icons/Person';

const drawerWidth = 200;

const styles = theme => ({
  appBar: {
    position: 'absolute',
    marginLeft: drawerWidth,
    [theme.breakpoints.up('md')]: {
      width: `calc(100% - ${drawerWidth}px)`,
    },
    borderLeft: '1px solid rgba(0, 0, 0, 0.12)',
    backgroundColor: 'white',
    color: 'rgba(0, 0, 0, 0.54)',
    boxShadow: 'none',
  },
  navIconHide: {
    [theme.breakpoints.up('md')]: {
      display: 'none',
    },
  },
  title: {
    color: 'rgba(0,0,0,0.4)',
    fontSize: '18px',
    letterSpacing: '1.25px',
    flexGrow: 1
  }
});

const Header = ({
  classes,
  handleDrawerToggle,
  isAccountPage,
  title,
}) => (
  <AppBar
    className={classes.appBar}
  >
    <Toolbar
      style={{ paddingLeft: '16px' }}
    >
      <IconButton
        color="rgba(0, 0, 0, 0.54)"
        aria-label="Open drawer"
        onClick={handleDrawerToggle}
        className={classes.navIconHide}
      >
        <img width='24px' height='24px' src='/img/favicon.png' />
      </IconButton>
      <Typography
        variant="title"
        color="inherit"
        className={classes.title}
      >
        {title}
      </Typography>
      {!isAccountPage && (
        <IconButton
        onClick={() => openNewWindow('/u')}
        >
          <Person color='rgba(0,0,0,0.4)' />
        </IconButton>
      )}
      {isAccountPage && (
        <IconButton
          onClick={() => openNewWindow('/u/configure')}
        >
          <ColorLens color='rgba(0,0,0,0.4)' />
        </IconButton>
      )}
    </Toolbar>
  </AppBar>
);


export default compose(
  withStyles(styles, { withTheme: true })
)(Header);
  