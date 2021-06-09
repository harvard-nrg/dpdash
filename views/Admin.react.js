import React, { Component } from 'react';
import { connect } from 'react-redux';
import 'whatwg-fetch';
import update from 'immutability-helper';
import { Column, Table } from 'react-virtualized';
import * as _ from 'lodash';
import uuid from 'uuid';
import classNames from 'classnames';

import Settings from '@material-ui/icons/Settings';
import SearchIcon from '@material-ui/icons/Search';
import Clear from '@material-ui/icons/Clear';

import DialogActions from '@material-ui/core/DialogActions';
import DialogTitle from '@material-ui/core/DialogTitle';
import DialogContent from '@material-ui/core/DialogContent';
import Dialog from '@material-ui/core/Dialog';
import Button from '@material-ui/core/Button';
import Subheader from '@material-ui/core/ListSubheader';
import SelectField from '@material-ui/core/Select';
import MenuItem from '@material-ui/core/MenuItem';
import Checkbox from '@material-ui/core/Checkbox';
import IconButton from '@material-ui/core/IconButton';
import AppBar from '@material-ui/core/AppBar';
import Toolbar from '@material-ui/core/Toolbar';
import Typography from '@material-ui/core/Typography';
import NoSsr from '@material-ui/core/NoSsr';
import Select from 'react-select';
import TextField from '@material-ui/core/TextField';
import Paper from '@material-ui/core/Paper';
import Chip from '@material-ui/core/Chip';
import { emphasize } from '@material-ui/core/styles/colorManipulator';

import { compose } from 'redux';
import { withStyles } from '@material-ui/core/styles';

import Sidebar from './components/Sidebar';
import getAvatar from './fe-utils/avatarUtil';
import getCounts from './fe-utils/countUtil';
import { fetchSubjects, fetchStudies, fetchUsers } from './fe-utils/fetchUtil';

const drawerWidth = 200;

const memberMenu = [
  { value: 0, level: 'admin', text: 'System Admins' },
  { value: 1, level: 'manager', text: 'Study Manager' },
  { value: 2, level: 'member', text: 'Member' }
];

const styles = theme => ({
  root: {
    flexGrow: 1,
    height: '100vh',
    zIndex: 1,
    overflow: 'hidden',
    position: 'relative',
    display: 'flex',
    width: '100%',
  },
  appBar: {
    position: 'absolute',
    marginLeft: drawerWidth,
    [theme.breakpoints.up('md')]: {
      width: `calc(100% - ${drawerWidth}px)`,
    },
    borderLeft: '1px solid rgba(0, 0, 0, 0.12)',
    backgroundColor: 'white',
    color: 'rgba(0, 0, 0, 0.54)'
  },
  navIconHide: {
    [theme.breakpoints.up('md')]: {
      display: 'none',
    },
  },
  content: {
    borderLeft: '1px solid rgba(0, 0, 0, 0.12)',
    flexGrow: 1,
    backgroundColor: '#fefefe',
    padding: theme.spacing.unit * 3,
  },
  input: {
    display: 'flex',
    padding: 0,
  },
  valueContainer: {
    display: 'flex',
    flexWrap: 'wrap',
    flex: 1,
    alignItems: 'center',
  },
  chip: {
    margin: `${theme.spacing.unit / 2}px ${theme.spacing.unit / 4}px`,
  },
  chipFocused: {
    backgroundColor: emphasize(
      theme.palette.type === 'light' ? theme.palette.grey[300] : theme.palette.grey[700],
      0.08,
    ),
  },
  noOptionsMessage: {
    padding: `${theme.spacing.unit}px ${theme.spacing.unit * 2}px`,
  },
  singleValue: {
    fontSize: 16,
  },
  placeholder: {
    position: 'absolute',
    left: 2,
    fontSize: 16,
  },
  paper: {
    marginTop: theme.spacing.unit,
    position: 'absolute',
    width: '100%'
  },
});

function NoOptionsMessage(props) {
  return (
    <Typography
      color="textSecondary"
      className={props.selectProps.classes.noOptionsMessage}
      {...props.innerProps}
    >
      {props.children}
    </Typography>
  );
}
function inputComponent({ inputRef, ...props }) {
  return <div ref={inputRef} {...props} />;
}
function Control(props) {
  return (
    <TextField
      fullWidth
      InputProps={{
        inputComponent,
        inputProps: {
          className: props.selectProps.classes.input,
          inputRef: props.innerRef,
          children: props.children,
          ...props.innerProps,
        },
        disableUnderline: true
      }}
      {...props.selectProps.textFieldProps}
    />
  );
}
function Option(props) {
  return (
    <MenuItem
      buttonRef={props.innerRef}
      selected={props.isFocused}
      component="div"
      style={{
        fontWeight: props.isSelected ? 500 : 400,
      }}
      {...props.innerProps}
    >
      <Typography
        color='textPrimary'
      >
        {props.children}
      </Typography>
    </MenuItem>
  );
}
function Placeholder(props) {
  return (
    <Typography
      color="textSecondary"
      className={props.selectProps.classes.placeholder}
      {...props.innerProps}
    >
      {props.children}
    </Typography>
  );
}
function SingleValue(props) {
  return (
    <Typography className={props.selectProps.classes.singleValue} {...props.innerProps}>
      {props.children}
    </Typography>
  );
}
function ValueContainer(props) {
  return <div className={props.selectProps.classes.valueContainer}>{props.children}</div>;
}
function MultiValue(props) {
  return (
    <Chip
      tabIndex={-1}
      label={
        props.children
      }
      className={classNames(props.selectProps.classes.chip, {
        [props.selectProps.classes.chipFocused]: props.isFocused,
      })}
      onDelete={event => {
        props.removeProps.onClick();
        props.removeProps.onMouseDown(event);
      }}
    />
  );
}
function Menu(props) {
  return (
    <Paper square className={props.selectProps.classes.paper} {...props.innerProps}>
      {props.children}
    </Paper>
  );
}
function DropdownIndicator() {
  return (
    <SearchIcon color='disabled' />
  );
}
const indicatorSeparatorStyle = {
  display: 'none'
};

const IndicatorSeparator = ({ innerProps }) => {
  return (
    <span style={indicatorSeparatorStyle} {...innerProps} />
  );
};

class AdminPage extends Component {
  constructor(props) {
    super(props);
    this.state = {
      tab: 0,
      width: 0,
      height: 0,
      sortBy: '',
      sortDirection: 'ASC',
      marginHeight: 72,
      marginWidth: 24,
      studies: [],
      editACL: [],
      editLevel: '',
      openAccess: false,
      openReset: false,
      resetUser: 0,
      totalStudies: 0,
      totalSubjects: 0,
      totalDays: 0,
      mobileOpen: false,
      search: [],
      search_array: [],
      autocomplete: [],
      deleteUser: -1
    };
  }
  componentDidUpdate() {
  }
  componentDidMount() {
    this.setState({
      width: window.innerWidth - this.state.marginWidth,
      height: window.innerHeight - this.state.marginHeight,
      avatar: getAvatar({ user: this.props.user })
    })
    /* Resize listener register */
    window.addEventListener('resize', this.handleResize)
  }
  // eslint-disable-next-line react/no-deprecated
  async componentWillMount() {
    try {
      const acl = await fetchSubjects();
      this.setState(getCounts({ acl }));
      const users = await fetchUsers();
      this.setState({
        users,
        autocomplete: this.autocomplete({ users }),
      });
      const studies = await fetchStudies();
      this.setState({
        studies: studies.map(suggestion => ({
          value: suggestion,
          label: suggestion
        }))
      });
    } catch (err) {
      console.error(err.message);
    }
  }
  componentWillUnmount() {
    window.removeEventListener('resize', this.handleResize);
  }
  handleDrawerToggle = () => {
    this.setState(state => ({ mobileOpen: !state.mobileOpen }));
  };
  autocomplete = ({ users }) => users.map(option => ({
      value: option.uid,
      label: ((/\S/.test(option.display_name) && option.display_name != undefined) ? option.display_name : option.uid)
    }));
  handleTab = (value) => {
    this.setState({
      tab: value,
    });
  }
  handleResize = () => {
    this.setState({
      width: window.innerWidth - this.state.marginWidth,
      height: window.innerHeight - this.state.marginHeight
    })
  }
  sort = ({ sortBy, sortDirection }) => {
    const sortedList = this.sortList({ sortBy, sortDirection })
    this.setState({
      sortBy: sortBy,
      sortDirection: sortDirection,
      users: sortedList
    })
  }
  sortList = ({ sortBy, sortDirection }) => {
    let list = _.map(this.state.users, _.clone)
    return _.orderBy(list, [sortBy], sortDirection.toLowerCase())
  }
  rowClassName = ({ index }) => {
    if (index < 0) {
      return 'headerRow'
    } else {
      return index % 2 === 0 ? 'evenRow' : 'oddRow'
    }
  }
  resetPassword = (cellData) => {
    let index = _.findIndex(this.state.users, function (i) { return cellData['rowData'].uid == i.uid });
    this.openReset(index);
  }
  closeReset = () => {
    this.setState({
      openReset: false,
      resetUser: 0
    });
  }
  deleteUser = (cellData) => {
    let index = _.findIndex(this.state.users, function (i) { return cellData['rowData'].uid == i.uid });
    this.setState({
      deleteUser: index,
      openDelete: true
    });
  }
  confirmDelete = () => {
    let index = this.state.deleteUser;
    return window.fetch('/api/v1/users/' + this.state.users[index].uid + '/delete', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      credentials: 'same-origin'
    }).then(() => {
      this.closeDelete();
      location.reload();
    });
  }
  closeDelete = () => {
    this.setState({
      openDelete: false,
      deleteUser: -1
    });
  }
  blockUser = (cellData) => {
    let index = _.findIndex(this.state.users, function (i) { return cellData['rowData'].uid == i.uid });
    let blocked = this.state.users[index]['blocked'] ? this.state.users[index]['blocked'] : false;
    let block = !blocked;
    let uid = this.state.users[index]['uid'];
    this.setState({
      users: update(this.state.users, {
        [index]: {
          blocked: {
            $set: block
          }
        }
      })
    });
    this.updateBlockedUser(uid, block);
  }
  updateBlockedUser = (uid, block) => {
    return window.fetch('/api/v1/users/' + uid + '/blocked', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      credentials: 'same-origin',
      body: JSON.stringify({
        blocked: block,
      })
    }).then(() => {
      return;
    });
  }
  openReset = (index) => {
    let uid = this.state.users[index]['uid'];
    let reset = this.state.users[index]['force_reset_pw'] ? this.state.users[index]['force_reset_pw'] : false;
    let reset_key = uuid.v4();
    if (reset == true) {
      reset_key = '';
      this.setState({
        users: update(this.state.users, {
          [index]: {
            force_reset_pw: {
              $set: !reset
            },
            reset_key: {
              $set: reset_key
            }
          }
        })
      });
    } else {
      this.setState({
        users: update(this.state.users, {
          [index]: {
            force_reset_pw: {
              $set: !reset
            },
            reset_key: {
              $set: reset_key
            }
          }
        }),
        openReset: true,
        resetUser: index
      });
    }

    this.updateReset(uid, !reset, reset_key);
  }
  updateReset = (uid, force_reset, reset_key) => {
    return window.fetch('/api/v1/users/' + uid + '/resetpw', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      credentials: 'same-origin',
      body: JSON.stringify({
        force_reset_pw: force_reset,
        reset_key: reset_key
      })
    }).then(() => {
      return;
    });
  }
  openAccess = (cellData) => {
    let index = _.findIndex(this.state.users, function (i) { return cellData['rowData'].uid == i.uid });
    let access = ('access' in this.state.users[index]) ? this.state.users[index]['access'].map(suggestion => ({
      value: suggestion,
      label: suggestion
    })) : [];
    this.setState({
      editACL: access,
      editLevel: this.findEditLevel(this.state.users[index]['role']),
      editUser: index,
      openAccess: true
    });
  }
  findEditLevel = (role) => {
    for (let key = 0; key < memberMenu.length; key++) {
      if (memberMenu[key].level === role) {
        return key
      }
    }
    return 0
  }
  closeAccess = () => {
    let role = memberMenu[this.state.editLevel]['level'];
    let uid = this.state.users[this.state.editUser]['uid'];
    this.updateRole(uid, role);

    this.setState({
      editACL: [],
      editUser: -1,
      openAccess: false
    });
  }
  handleAddChip = (chip) => {
    this.setState({
      editACL: update(this.state.editACL, {
        $push: [chip]
      })
    });
  }
  handleDeleteChip = (chip, index) => {
    this.setState({
      editACL: update(this.state.editACL, {
        $splice: [[index, 1]]
      })
    });
  }
  modifyACL = () => {
    let uid = this.state.users[this.state.editUser]['uid'];
    let role = memberMenu[this.state.editLevel]['level'];
    let access = this.state.editACL.map(f => f.value);

    this.setState({
      users: update(this.state.users, {
        [this.state.editUser]: {
          access: {
            $set: access
          },
          role: {
            $set: role
          }
        }
      })
    });
    return window.fetch('/api/v1/users/' + uid + '/studies', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      credentials: 'same-origin',
      body: JSON.stringify({
        acl: access,
      })
    }).then(() => {
      this.closeAccess();
    });
  }
  handleLevelChange = (event) => {
    this.setState({
      editLevel: event.target.value
    });
  }
  updateRole = (uid, role) => {
    return window.fetch('/api/v1/users/' + uid + '/role', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      credentials: 'same-origin',
      body: JSON.stringify({
        role: role,
      })
    }).then(() => {
      return;
    });
  }
  generatetMenu = (options) => {
    return options.map((option, index) => (
      <MenuItem key={index} value={index}>{option.text}</MenuItem>
    ));
  }
  handleSearch = value => {
    this.setState({
      search: value,
      search_array: value.map(option => option.value)
    });
  };
  handleChange = name => value => {
    this.setState({
      [name]: value,
    });
  };
  render() {
    const components = {
      Option, Control,
      NoOptionsMessage, Placeholder,
      SingleValue, MultiValue, IndicatorSeparator,
      ValueContainer, Menu, DropdownIndicator
    };
    const { classes } = this.props;
    return (
      <div
        className={classes.root}
      >
        <AppBar className={classes.appBar}>
          <Toolbar
            variant='dense'
            style={{
              paddingLeft: '16px'
            }}
          >
            <IconButton
              color="rgba(0, 0, 0, 0.54)"
              aria-label="Open drawer"
              onClick={this.handleDrawerToggle}
              className={classes.navIconHide}
            >
              <img width='24px' height='24px' src='/img/favicon.png' />
            </IconButton>
            <div style={{ width: '100%' }}>
              <NoSsr>
                <Select
                  classes={classes}
                  placeholder='Search users'
                  value={this.state.search}
                  onChange={this.handleSearch}
                  options={this.state.autocomplete}
                  autoFocus={true}
                  components={components}
                  isMulti
                />
              </NoSsr>
            </div>
          </Toolbar>
        </AppBar>
        <Sidebar
          avatar={this.state.avatar}
          handleDrawerToggle={this.handleDrawerToggle}
          mobileOpen={this.state.mobileOpen}
          totalDays={this.state.totalDays}
          totalStudies={this.state.totalStudies}
          totalSubjects={this.state.totalSubjects}
          user={this.props.user}
        />
        <div
          className={classes.content}
          style={{
            padding: '12px',
            marginTop: '48px',
          }}
        >
          {this.state.users ?
            <Table
              width={this.state.width < 960 ? this.state.width : this.state.width - drawerWidth}
              height={this.state.height}
              headerHeight={48}
              headerStyle={{
                fontFamily: '"Roboto", sans-serif',
                paddingTop: '24px',
                height: '48px',
                color: 'rgba(0, 0, 0, 0.54)',
                fontWeight: '500',
                fontSize: '0.75rem'
              }}
              rowStyle={{
                fontFamily: '"Roboto", sans-serif',
                height: '40px',
                fontSize: '0.8125rem',
                fontWeight: '400',
                color: 'rgba(0, 0, 0, 0.87)'
              }}
              rowHeight={48}
              rowCount={this.state.search_array.length > 0 ? this.state.search_array.length : this.state.users.length}
              rowGetter={({ index }) => this.state.users.filter((row) => {
                var key = row.uid;
                var filter = this.state.search_array;
                if (filter.length > 0 && filter.indexOf(key) === -1) {
                  return false;
                } else {
                  return true;
                }
              })[index]
              }
              rowClassName={this.rowClassName}
              sort={this.sort}
              sortBy={this.state.sortBy}
              sortDirection={this.state.sortDirection}
            >
              <Column
                label='Username'
                dataKey='uid'
                width={this.state.width / 6}
              />
              <Column
                width={this.state.width / 6}
                label='Name'
                dataKey='display_name'
              />
              <Column
                label='Email'
                dataKey='mail'
                width={this.state.width / 6}
              />
              <Column
                label='Role'
                dataKey='role'
                width={this.state.width / 6}
              />
              <Column
                label='Access'
                cellRenderer={(cellData) => (<Settings style={{ color: 'rgba(0, 0, 0, 0.54)' }} onClick={() => this.openAccess(cellData)}></Settings>)}
                dataKey='access'
                width={this.state.width / 6}
              />
              <Column
                label='Reset Password'
                cellRenderer={(cellData) => (<Checkbox checked={cellData['rowData']['force_reset_pw']} onClick={() => this.resetPassword(cellData)}></Checkbox>)}
                dataKey='force_reset_pw'
                width={this.state.width / 6}
              />
              <Column
                label='Inactive'
                cellRenderer={(cellData) => (<Checkbox checked={cellData['rowData']['blocked']} onClick={() => this.blockUser(cellData)}></Checkbox>)}
                dataKey='blocked'
                width={this.state.width / 6}
              />
              <Column
                label='Delete'
                cellRenderer={(cellData) => (
                  <IconButton
                    color="secondary"
                    aria-label="Delete a user"
                    onClick={() => this.deleteUser(cellData)}
                  >
                    <Clear />
                  </IconButton>
                )}
                width={this.state.width / 6}
              />
            </Table> : null}
        </div>
        <Dialog
          modal={false}
          open={this.state.openAccess}
          onClose={this.closeAccess}
          fullScreen={true}
        >
          <DialogTitle
            disableTypography={true}
            style={{
              backgroundColor: 'rgba(0,0,0,0.7)',
            }}
          >
            <Typography variant="headline" style={{ color: 'white' }}>Edit user privilege</Typography>
          </DialogTitle>
          <DialogContent
            style={{
              padding: '24px',
              overflowY: 'visible'
            }}
          >
            <Subheader
              style={{
                padding: '0px'
              }}
            >
              Membership Level
            </Subheader>
            <SelectField
              style={{ float: 'right' }}
              value={this.state.editLevel}
              onChange={this.handleLevelChange}
              fullWidth={true}
            >
              {this.generatetMenu(memberMenu)}
            </SelectField>
            &nbsp;
            <div
              style={{
                borderBottom: '1px solid #d3d3d3'
              }}
            >
              <Subheader
                style={{
                  padding: '0px'
                }}
              >
                Viewable Studies
              </Subheader>
              <NoSsr>
                <Select
                  classes={classes}
                  value={this.state.editACL}
                  onChange={this.handleChange('editACL')}
                  options={this.state.studies}
                  components={components}
                  placeholder="Search a study"
                  isMulti
                />
              </NoSsr>
            </div>
          </DialogContent>
          <DialogActions>
            <Button
              onClick={this.closeAccess}
            >Cancel</Button>
            <Button
              color="primary"
              keyboardFocused={true}
              onClick={this.modifyACL}
            >Submit</Button>
          </DialogActions>
        </Dialog>
        { this.state.users && this.state.deleteUser != -1 ?
          <Dialog
            modal={false}
            open={this.state.openDelete}
            onClose={this.closeDelete}
            fullScreen={true}
          >
            <DialogTitle
              style={{
                backgroundColor: 'rgba(0,0,0,0.7)'
              }}
            >
              <Typography style={{ color: 'white' }}>Delete user {this.state.users[this.state.deleteUser].display_name} (uid: {this.state.users[this.state.deleteUser].uid})?</Typography>
            </DialogTitle>
            <DialogActions>
              <Button
                onClick={this.closeDelete}
              >Cancel</Button>
              <Button
                color="primary"
                keyboardFocused={true}
                onClick={this.confirmDelete}
              >Delete</Button>
            </DialogActions>
          </Dialog> : null}
        { this.state.users ?
          <Dialog
            modal={false}
            open={this.state.openReset}
            onClose={this.closeReset}
          >
            <DialogTitle
              style={{
                backgroundColor: 'rgba(0,0,0,0.7)'
              }}
            >
              <Typography variant="headline" style={{ color: 'white' }}>Reset user password</Typography>
            </DialogTitle>
            <DialogContent>
              <Subheader
                style={{
                  padding: '0px'
                }}
              >
                {this.state.users[this.state.resetUser] ? 'Reset key for user: ' + this.state.users[this.state.resetUser]['uid'] : ''}
              </Subheader>
              <p>{this.state.users[this.state.resetUser]['reset_key'] ? this.state.users[this.state.resetUser]['reset_key'] : ''}</p>
            </DialogContent>
          </Dialog> : null}
      </div>
    );
  }
}

const mapStateToProps = (state) => ({
  user: state.user
})

export default compose(
  withStyles(styles, { withTheme: true }),
  connect(mapStateToProps)
)(AdminPage);
