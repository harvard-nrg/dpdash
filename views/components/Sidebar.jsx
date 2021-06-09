import React from 'react';
import { compose } from 'redux';
import { withStyles } from '@material-ui/core/styles';
import DrawerComponent from './Drawer';
import Drawer from '@material-ui/core/Drawer';
import Hidden from '@material-ui/core/Hidden';

const drawerWidth = 200;

const styles = theme => ({
  drawerPaper: {
    width: drawerWidth,
    [theme.breakpoints.up('md')]: {
      position: 'relative',
    },
    borderRight: '0px'
  },
});

const Sidebar = ({
  avatar,
  classes,
  handleDrawerToggle,
  mobileOpen,
  theme,
  totalDays,
  totalStudies,
  totalSubjects,
  user,
}) => (
  <>
    <Hidden
      mdUp>
      <Drawer
        variant="temporary"
        anchor={theme.direction === 'rtl' ? 'right' : 'left'}
        open={mobileOpen}
        onClose={handleDrawerToggle}
        classes={{
          paper: classes.drawerPaper,
        }}
        ModalProps={{
          keepMounted: true, // Better open performance on mobile.
        }}
      >
        <DrawerComponent
          avatar={avatar}
          totalStudies={totalStudies}
          totalSubjects={totalSubjects}
          totalDays={totalDays}
          user={user}
          name={user.name}
        />
      </Drawer>
    </Hidden>
    <Hidden
      smDown implementation="css">
      <Drawer
        variant="permanent"
        open
        classes={{
          paper: classes.drawerPaper,
        }}
      >
        <DrawerComponent
          avatar={avatar}
          totalStudies={totalStudies}
          totalSubjects={totalSubjects}
          totalDays={totalDays}
          user={user}
          name={user.name}
        />
      </Drawer>
    </Hidden>
</>
);

export default compose(
  withStyles(styles, { withTheme: true })
)(Sidebar);
  