import React, {Component} from 'react';
import {connect} from 'react-redux';
import moment from 'moment';
import 'whatwg-fetch';
import update from 'immutability-helper';

import Person from '@material-ui/icons/Person';
import ColorLens from '@material-ui/icons/ColorLens';
import Edit from '@material-ui/icons/Edit';
import Clear from '@material-ui/icons/Clear';
import Share from '@material-ui/icons/Share';
import FullView from '@material-ui/icons/AspectRatio';
import Add from '@material-ui/icons/Add';
import Copy from '@material-ui/icons/FileCopy';
import ContentAdd from '@material-ui/icons/Add';
import AttachFile from '@material-ui/icons/AttachFile';

import Card from '@material-ui/core/Card';
import CardActions from '@material-ui/core/CardActions';
import CardHeader from '@material-ui/core/CardHeader';
import CardMedia from '@material-ui/core/CardMedia';
import CardContent from '@material-ui/core/CardContent';

import FormControlLabel from '@material-ui/core/FormControlLabel';
import Button from '@material-ui/core/Button';
import GridList from '@material-ui/core/GridList';
import Avatar from '@material-ui/core/Avatar';
import IconButton from '@material-ui/core/IconButton';
import Dialog from '@material-ui/core/Dialog';
import DialogActions from '@material-ui/core/DialogActions';
import DialogContent from '@material-ui/core/DialogContent';
import DialogTitle from '@material-ui/core/DialogTitle';
import ChipInput from 'material-ui-chip-input';
import Switch from '@material-ui/core/Switch';
import Divider from '@material-ui/core/Divider';
import AppBar from '@material-ui/core/AppBar';
import Toolbar from '@material-ui/core/Toolbar';
import Snackbar from '@material-ui/core/Snackbar';
import ButtonBase from '@material-ui/core/ButtonBase';
import Tooltip from '@material-ui/core/Tooltip';

import {compose} from 'redux';
import { withStyles } from '@material-ui/core/styles';
import DrawerComponent from './Drawer.react';
import Drawer from '@material-ui/core/Drawer';
const drawerWidth = 200;
import Hidden from '@material-ui/core/Hidden';

import NoSsr from '@material-ui/core/NoSsr';
import TextField from '@material-ui/core/TextField';
import Paper from '@material-ui/core/Paper';
import Chip from '@material-ui/core/Chip';
import MenuList from '@material-ui/core/MenuList';
import MenuItem from '@material-ui/core/MenuItem';
import CancelIcon from '@material-ui/icons/Cancel';
import { emphasize } from '@material-ui/core/styles/colorManipulator';
import Select from 'react-select';
import classNames from 'classnames';
import Typography from '@material-ui/core/Typography';

const styles = theme => ({
  root: {
    flexGrow: 1,
    height: '100vh',
    zIndex: 1,
    overflow: 'hidden',
    position: 'relative',
    display: 'flex',
    width: '100%',
    backgroundColor: '#fefefe',
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
  drawerPaper: {
    width: drawerWidth,
    [theme.breakpoints.up('md')]: {
      position: 'relative',
    },
    borderRight: '0px'
  },
  content: {
    flexGrow: 1,
    borderLeft: '1px solid rgba(0, 0, 0, 0.12)',
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
    position: 'relative',
    marginTop: theme.spacing.unit,
    left: 0,
    right: 0,
    zIndex: 1
  },
  divider: {
    height: theme.spacing.unit * 2,
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
      {props.children}
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
      label={props.children}
      className={classNames(props.selectProps.classes.chip, {
        [props.selectProps.classes.chipFocused]: props.isFocused,
      })}
      onDelete={props.removeProps.onClick}
      deleteIcon={<CancelIcon {...props.removeProps} />}
    />
  );
}

function Menu(props) {
  return (
    <Paper square className={props.selectProps.classes.paper} {...props.innerProps}>
        <MenuList>
            {props.children}
        </MenuList>
    </Paper>
  );
}

const components = {
  Control,
  Menu,
  MultiValue,
  NoOptionsMessage,
  Option,
  Placeholder,
  SingleValue,
  ValueContainer,
};

class ConfigPage extends Component {
    constructor(props) {
        super(props);
        this.state = {
            user: {},
            preferences:{}, 
            configurations: [],
            gridCols : 1,
            gridWidth : 350,
            searchUsers: false,
            friends: [],
            shared: [],
            snackTime: false,
            uploadSnack: false,
            selectedConfig: {},
            configOwner: '',
            totalStudies: 0,
            totalSubjects: 0,
            totalDays : 0,
            mobileOpen: false
        };
    }
    handleDrawerToggle = () => {
        this.setState(state => ({ mobileOpen: !state.mobileOpen }));
    };
    componentDidUpdate() {
    }
    componentWillMount() {
        this.fetchConfigurations(this.props.user.uid);
        this.fetchPreferences(this.props.user.uid);
        this.fetchUsers();
        this.fetchSubjects();
    }
    fetchSubjects = () => {
        return window.fetch('/api/v1/studies', {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json'
            },
            credentials: 'same-origin'
        }).then((response) => {
            if (response.status !== 200) {
                return
            }
            return response.json()
        }).then((response) => {
            let studies = response ? response : [];
            window.fetch('/api/v1/subjects?q=' + JSON.stringify(studies), {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json'
                },
                credentials: 'same-origin',
            }).then((response) => {
                if (response.status !== 200) {
                    return
                }
                return response.json()
            }).then((response) => {
                this.autocomplete(response)
            });
        });
    }
    autocomplete = (acl) => {
        var options = [];
        for(var study = 0; study < acl.length; study++) {
            Array.prototype.push.apply(options, acl[study].subjects);
        }
        this.setState({
            totalStudies: acl.length,
            totalSubjects: options.length,
            totalDays: Math.max.apply(Math, options.map(function(o) { return o.days; }))
        });
    }
    componentDidMount() {
        if(this.props.user.message.length > 0) {
            this.setState({
                uploadSnack: true,
                avatar : this.getAvatar()
            });
        } else {
            this.setState({
                avatar : this.getAvatar()
            });
        }
        /* Initial Sizing */
        this.handleResize(true);
        /* Resize listener register */
        window.addEventListener('resize', this.handleResize);
    }
    componentWillUnmount() {
        window.removeEventListener('resize', this.handleResize);
    }
    getAvatar = () => {
        var icon = this.props.user.icon;
        var username = this.props.user.name;
        var uid = this.props.user.uid;
        if(icon == '' || icon == undefined) {
            if(username == '' || username == undefined) {
                if(uid && uid.length > 0) {
                    return <Avatar style={{width: 60, height: 60}}>{uid[0]}</Avatar>
                } else {
                    return <Avatar style={{width: 60, height: 60, backgroundColor: '#c0d9e1'}}><Person /></Avatar>
                }
            } else {
                return <Avatar style={{width: 60, height: 60, backgroundColor: '#c0d9e1'}}>{username[0]}</Avatar>
            }
        } else {
            return <Avatar style={{width: 60, height: 60}} src={icon}></Avatar>
        }
    }
    handleResize = (event) => {
        if (window.innerWidth >= 768) {
            let gridCols = Math.floor(window.innerWidth / this.state.gridWidth);
            this.setState({
                gridCols: gridCols
            });
        } else {
            this.setState({
                gridCols: 1
            });
        }
    }
    fetchUsers = () => {
        return window.fetch('/api/v1/search/users', {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json'
            },
            credentials: 'same-origin'
        }).then((response) => {
            if (response.status !== 200) {
                return;
            }
            return response.json();
        }).then((response) => {
            this.setState({
                friends: response.map(friend => ({
                    value: friend,
                    label: friend
                }))
            });
        });
    }
    babyProofPreferences = (preferences) => {
        let preference = {};
        preference['star'] = 'star' in preferences ? preferences['star'] : {};
        preference['sort'] = 'sort' in preferences ? preferences['sort'] : 0;
        preference['config'] = 'config' in preferences ? preferences['config'] : '';
        preference['complete'] = 'complete' in preferences ? preferences['complete'] : {};
        return preference;
    }
    updateUserPreferences = (index, type) => {
        let uid = this.props.user.uid;
        let preference = {};
        if (type == 'index') {
            if(this.state.configurations.length > 0  && this.state.configurations[index]) {
                preference['config'] = this.state.configurations[index]['_id'];
            }
        } else {
            preference['config'] = index;
        }
        preference['complete'] = 'complete' in this.state.preferences ? this.state.preferences['complete'] : {};
        preference['star'] = 'star' in this.state.preferences ? this.state.preferences['star'] : {};
        preference['sort'] = 'sort' in this.state.preferences ? this.state.preferences['sort'] : 0;
        preference = this.babyProofPreferences(preference);

        return window.fetch('/api/v1/users/' + uid + '/preferences', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            credentials: 'same-origin',
            body: JSON.stringify({
                preferences: preference
            })
        }).then((response) => {
            if (type == 'index') {
                this.setState({
                    preferences: preference,
                    snackTime: true
                });
            } else {
                this.setState({
                    preferences: preference
                });
            }
        });
    }
    fetchPreferences = (uid) => {
        return window.fetch('/api/v1/users/' + uid + '/preferences', {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json'
            },
            credentials: 'same-origin'
        }).then((response) => {
            if (response.status !== 200) {
                return;
            }
            return response.json();
        }).then((response) => {
            this.setState({
                preferences: this.babyProofPreferences(response)
            });
        });
    }
    fetchConfigItem =(uid, _id)=> {
        return window.fetch('/api/v1/users/' + uid + '/configs/' + _id , {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json'
            },
            credentials: 'same-origin'
        }).then((response) => {
            if (response.status !== 200) {
                return;
            }
            return response.json();
        }).then((response) => {
        });
    }
    fetchConfigurations = (uid) => {
        return window.fetch('/api/v1/users/' + uid + '/configs', {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json'
            },
            credentials: 'same-origin'
        }).then((response) => {
            if (response.status !== 200) {
                return;
            }
            return response.json();
        }).then((response) => {
            this.setState({
                configurations: response
            });
        });
    }
    updateConfigurations = (configID, ownsConfig) => {
        if(ownsConfig) {
            window.fetch('/api/v1/users/' + this.props.user.uid + '/configs', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                credentials: 'same-origin',
                body: JSON.stringify({
                    remove : configID
                })
            }).then((response) => {
                return;
            });
        } else {
            window.fetch('/api/v1/users/' + this.props.user.uid + '/configs', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                credentials: 'same-origin',
                body: JSON.stringify({
                    disable : configID
                })
            }).then((response) => {
                return;
            });
        }
    }
    handleCrumbs =()=> {
        this.setState({
            snackTime: false,
            uploadSnack : false
        });
    }
    removeConfig = (configs, index, configID, ownsConfig) => {
        this.updateConfigurations(configID, ownsConfig);
        this.setState({
            configurations: update(configs, {
                $splice: [[index, 1]]
            }),
            snackTime: true
        });
        if(index == this.state.preferences['config']) {
            this.updateUserPreferences(0, 'index');
        }
    }
    openSearchUsers = (index, configID, shared, owner) => {
        this.setState({
            searchUsers: true,
            selectedConfig: {
                _id: configID,
                index: index
            },
            shared: shared.map(friend => ({
                label: friend,
                value: friend
            })),
            configOwner: owner 
        });
    }
    closeSearchUsers = () => {
        this.setState({
            searchUsers: false,
            selectedConfig: {
                _id: '',
                index: -1
            },
            shared: [],
            configOwner: ''
        });
    }
    copyConfig = (config) => {
        let newConfig = {};
        newConfig['owner'] = this.props.user.uid;
        newConfig['readers'] = [this.props.user.uid];
        newConfig['created'] = (new Date()).toUTCString();
        newConfig['type'] = config['type'];
        newConfig['name'] = config['name'];
        newConfig['config'] = config['config'];

        return window.fetch('/api/v1/users/' + this.props.user.uid + '/configs', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            credentials: 'same-origin',
            body: JSON.stringify({
                add : newConfig
            })
        }).then((response) => {
            if (response.status == 201) {
                this.fetchConfigurations(this.props.user.uid);
            }
        });
    }
    openNewWindow = (uri) => {
        window.open(uri, '_self');
    }
    generateCards = (configs, preference) => {
        let cards = [];
        if(configs && configs.length > 0) {
            for (let item in configs) {
                let ownsConfig = this.props.user.uid === configs[item]['owner'] ? true : false;
                let showTime = 'modified' in configs[item] ? configs[item]['modified'] : configs[item]['created'];
                let localTime = moment.utc(showTime).local().format();
                let updated = moment(localTime).calendar();
                cards.push(
                    <Card
                        style={{
                            margin: '3px'
                        }}
                    >
                        <CardHeader
                            title={configs[item]['owner']}
                            subheader={updated}
                            avatar={this.state.avatar}
                            action={
                                <IconButton
                                    onClick={() => this.removeConfig(configs,item,configs[item]['_id'],ownsConfig)}
                                >
                                    <Clear color='rgba(0, 0, 0, 0.54)'/>
                                </IconButton>
                            }
                        />
                        <Divider />
                        <div
                            style={{
                                padding: '16px 24px'
                            }}
                        >
                            <Typography
                                variant="headline"
                                component="h3"
                            >
                                {configs[item]['name']}
                            </Typography>
                            <Typography
                                style={{
                                    color: 'rgba(0, 0, 0, 0.54)'
                                }}
                                component="p"
                            >
                                {configs[item]['type']}
                            </Typography>
                        </div>
                        <CardActions
                        >
                            <div
                                style={{
                                    padding: '0px',
                                    display: 'inline-block',
                                    whiteSpace: 'nowrap',
                                    width: '100%',
                                }}
                            >
                                <div style={{ float: 'right'}}>
                                    { ownsConfig ? <IconButton
                                        onClick={() => this.openNewWindow('/u/configure?s=edit&id=' + configs[item]['_id'])}
                                        iconStyle={{color: 'rgba(0, 0, 0, 0.54)'}} 
                                        tooltipPosition='top-center' 
                                        tooltip="Edit"><Edit/></IconButton> : <IconButton
                                        onClick={() => this.openNewWindow('/u/configure?s=view&id=' + configs[item]['_id'])}
                                        iconStyle={{color: 'rgba(0, 0, 0, 0.54)'}} 
                                        tooltipPosition='top-center' 
                                        tooltip="View"><FullView/></IconButton>
                                    }
                                    { ownsConfig ? <IconButton
                                        iconStyle={{color: 'rgba(0, 0, 0, 0.54)'}}
                                        tooltipPosition='top-center'
                                        tooltip="Share"
                                        onClick={() => this.openSearchUsers(item, configs[item]['_id'], configs[item]['readers'], configs[item]['owner'])}
                                        ><Share /></IconButton> : <IconButton
                                            iconStyle={{color: 'rgba(0, 0, 0, 0.54)'}}
                                            tooltipPosition='top-center'
                                            tooltip="Duplicate"
                                            onClick={() => this.copyConfig(configs[item])}
                                        >
                                        <Copy />
                                        </IconButton>
                                    }
                                </div>
                                <FormControlLabel
                                    control={
                                        <Switch
                                            style={{
                                                width: 'auto',
                                            }}
                                            labelStyle={{color: 'rgba(0, 0, 0, 0.54)'}}
                                            checked={'config' in preference ? configs[item]['_id'] == preference['config'] : false}
                                            onChange={(e, isInputChecked) => this.changeDefaultConfig(e, isInputChecked, item)}
                                        />
                                    }
                                    label='Default'
                                />
                            </div>
                        </CardActions>
                    </Card>
                );
            }
        }
        return cards;
    }
    shareWithUsers = () => {
        return window.fetch('/api/v1/users/' + this.props.user.uid + '/configs', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            credentials: 'same-origin',
            body: JSON.stringify({
                share : this.state.selectedConfig['_id'],
                shared: this.state.shared.map(o => { return o.value })
            })
        }).then((response) => {
            if (response.status == 201) {
                this.setState({
                    configurations: update(this.state.configurations, {
                        [this.state.selectedConfig['index']]: {
                            ['readers'] : {
                                $set : this.state.shared.map(o => { return o.value })
                            }
                        }
                    })
                });
            }
            this.closeSearchUsers();
        });
    }
    handleChange = name => value => {
        let uid = this.props.user.uid;
        let names = value.map(o=> {return o.value});
        if(names.indexOf(uid) === -1) {
            console.log("Can't delete the owner.");
            return;
        }
        this.setState({
            [name]: value,
        });
    }
    handleChangeFile = (event) => {
        this.refs.config_file.submit();
    }
    changeDefaultConfig = (e, checked, index) => {
        this.updateUserPreferences(index, 'index');
    }
    render() {
        const { classes, theme } = this.props;
        const actions = [
            <Button
                onClick={this.closeSearchUsers}
                style={{
                    color: '#5790bd'
                }}
            >Cancel</Button>,
            <Button
                variant="outlined"
                style={{
                    borderColor: '#5790bd',
                    paddingTop: '11px',
                    color: '#ffffff',
                    backgroundColor: '#5790bd',
                    marginLeft: '12px'
                }}
                keyboardFocused={true}
                onClick={this.shareWithUsers}
            >Submit</Button>,
        ];
        const selectStyles = {
            input: base => ({
                ...base,
                color: theme.palette.text.primary,
                '& input': {
                    font: 'inherit',
                },
            }),
        };
        return (
              <div
                className={classes.root}
                >
                <AppBar
                    style={{
                        backgroundColor: '#ffffff',
                        boxShadow: 'none',
                    }}
                    className={classes.appBar}
                >
                    <Toolbar
                        style={{paddingLeft: '16px'}}
                    >
                        <IconButton
                            color="rgba(0, 0, 0, 0.54)"
                            aria-label="Open drawer"
                            onClick={this.handleDrawerToggle}
                            className={classes.navIconHide}
                        >
                            <img width='24px' height='24px' src='/img/favicon.png'/>
                        </IconButton>
                        <Typography
                            variant="title"
                            color="inherit"
                            style={{
                                color: 'rgba(0,0,0,0.4)',
                                fontSize: '18px',
                                letterSpacing: '1.25px',
                                flexGrow: 1
                            }}
                        >
                            Configuration
                        </Typography>
                        <IconButton
                            onClick={() => this.openNewWindow('/u')}
                        >
                            <Person color='rgba(0,0,0,0.4)'/>
                        </IconButton>
                    </Toolbar>
                </AppBar>
                <Hidden
                mdUp>
                    <Drawer
                        variant="temporary"
                        anchor={theme.direction === 'rtl' ? 'right' : 'left'}
                        open={this.state.mobileOpen}
                        onClose={this.handleDrawerToggle}
                        classes={{
                            paper: classes.drawerPaper,
                        }}
                        ModalProps={{
                            keepMounted: true, // Better open performance on mobile.
                        }}
                    >
                        <DrawerComponent
                            avatar={this.state.avatar}
                            totalStudies={this.state.totalStudies}
                            totalSubjects={this.state.totalSubjects}
                            totalDays={this.state.totalDays}
                            user={this.props.user}
                            name={this.props.user.name}
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
                            avatar={this.state.avatar}
                            totalStudies={this.state.totalStudies}
                            totalSubjects={this.state.totalSubjects}
                            totalDays={this.state.totalDays}
                            user={this.props.user}
                            name={this.props.user.name}
                        />
                    </Drawer>
                </Hidden>
                <div
                    className={classes.content}
                    style={{
                        padding: '12px',
                        marginTop: '64px',
                        overflow: 'scroll',
                    }}
                >
                            <GridList
                                style={{
                                    padding: '2px',
                                    overflowY: 'auto',
                                    marginBottom: '128px',
                                }}
                                cols={this.state.gridCols}
                                cellHeight='auto'
                            >
                                {this.generateCards(this.state.configurations, this.state.preferences)}
                            </GridList>
                            <div
                                style={{
                                    right: 4,
                                    bottom: 4,
                                    position:'fixed'
                                }}
                            >
                                <form ref='config_file' action={'/api/v1/users/' + this.props.user.uid + '/config/file'} method="post" encType="multipart/form-data">
                                    <input
                                        accept='.csv'
                                        name='file'
                                        id="raised-button-file"
                                        multiple
                                        type="file"
                                        style={{display: 'none'}}
                                        onChange={this.handleChangeFile}
                                    />
                                    <label htmlFor="raised-button-file">
                                        <Button
                                            component="span"
                                            variant="fab"
                                            focusRipple
                                            style={{
                                                marginBottom: '8px'
                                            }}
                                        >
                                            <Tooltip title="Upload configuration file">
                                                <AttachFile />
                                            </Tooltip>
                                        </Button>
                                    </label>
                                </form>
                                <Button
                                    variant="fab"
                                    color="secondary"
                                    href='/u/configure?s=add'
                                    focusRipple
                                >
                                    <Tooltip title="Add a configuration manually">
                                        <ContentAdd />
                                    </Tooltip>
                                </Button>
                        </div>
                    <Dialog
                        open={this.state.searchUsers}
                        onClose={this.closeSearchUsers}
                        fullScreen={true}
                    >
                        <DialogTitle
                            id="alert-dialog-title"
                            disableTypography={true}
                            style={{
                                backgroundColor: 'rgba(0,0,0,0.7)',
                            }}
                        >
                            <Typography
                                variant='title'
                                style={{
                                    color: '#ffffff'
                                }}
                            >
                                Share your configuration
                            </Typography>
                        </DialogTitle>
                        <DialogContent
                            style={{
                                padding: '24px',
                                overflowY: 'visible'
                            }}
                        >
                            <Select
                                classes={classes}
                                styles={selectStyles}
                                textFieldProps={{
                                    label: 'Shared with',
                                    InputLabelProps: {
                                        shrink: true,
                                    },
                                }}
                                options={this.state.friends}
                                components={components}
                                value={this.state.shared}
                                onChange={this.handleChange('shared')}
                                placeholder='Shared with'
                                isMulti
                            />
                        </DialogContent>
                        <DialogActions>
                            {actions}
                        </DialogActions>
                    </Dialog>
                </div>
                <Snackbar
                    open={this.state.snackTime}
                    message="Your configuration has been updated."
                    autoHideDuration={2000}
                    onRequestClose={this.handleCrumbs}
                />
                <Snackbar
                    open={this.state.uploadSnack}
                    message={this.props.user.message}
                    autoHideDuration={2000}
                    onRequestClose={this.handleCrumbs}
                />
              </div>
        );
    }
}

/*
                            <ChipInput
                                style={{
                                    width: '100%'
                                }}
                                label='Shared with'
                                dataSource={this.state.friends}
                                value={this.state.shared}
                                onAdd={(chip) => this.handleAddChip(chip)}
                                onDelete={(chip, index) => this.handleDeleteChip(chip, index)}
                                />
*/

const mapStateToProps = (state) => ({
    user: state.user
});

export default compose(
    withStyles(styles, { withTheme: true }),
    connect(mapStateToProps)
)(ConfigPage);
