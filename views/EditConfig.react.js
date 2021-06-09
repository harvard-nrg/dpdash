import React, { Component } from 'react';
import { connect } from 'react-redux';
import 'whatwg-fetch';
import update from 'immutability-helper';
import * as _ from 'lodash';
import colorbrewer from 'colorbrewer';
import { bignumber, number, add, subtract, divide, abs } from 'mathjs';

import Typography from '@material-ui/core/Typography';
import TextField from '@material-ui/core/TextField';
import Select from '@material-ui/core/Select';
import MenuItem from '@material-ui/core/MenuItem';
import Divider from '@material-ui/core/Divider';
import GridList from '@material-ui/core/GridList';
import Card from '@material-ui/core/Card';
import CardActions from '@material-ui/core/CardActions';
import CardHeader from '@material-ui/core/CardHeader';
import CardMedia from '@material-ui/core/CardMedia';
import Snackbar from '@material-ui/core/Snackbar';
import IconButton from '@material-ui/core/IconButton';
import Visibility from '@material-ui/icons/Visibility';
import VisibilityOff from '@material-ui/icons/VisibilityOff';
import Checkbox from '@material-ui/core/Checkbox';
import Button from '@material-ui/core/Button';
import FormControlLabel from '@material-ui/core/FormControlLabel';

import ContentAdd from '@material-ui/icons/Add';
import Copy from '@material-ui/icons/FileCopy';
import Delete from '@material-ui/icons/Delete';
import Save from '@material-ui/icons/Save';
import Back from '@material-ui/icons/ChevronLeft';

import { compose } from 'redux';
import { withStyles } from '@material-ui/core/styles';
import Paper from '@material-ui/core/Paper';
import Chip from '@material-ui/core/Chip';
import CancelIcon from '@material-ui/icons/Cancel';
import { emphasize } from '@material-ui/core/styles/colorManipulator';
import ReactSelect from 'react-select';
import classNames from 'classnames';

import { fetchUsernames } from './fe-utils/fetchUtil';

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
      {props.children}
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

class EditConfig extends Component {
  constructor(props) {
    super(props);
    this.state = {
      gridWidth: 300,
      gridCols: 1,
      user: {},
      friends: [],
      colorblock: [],
      colorarray: [],
      themes: [],
      snackTime: false,
      viewOnly: true
    };
  }
  componentDidUpdate() {
  }
  // eslint-disable-next-line react/no-deprecated
  async componentWillMount() {
    try {
      this.brewColors();
      if (this.props.user.goal == 'edit') {
        this.fetchConfigurations(this.props.user.uid, this.props.user.config);
      } else if (this.props.user.goal == 'add') {
        this.setState({
          viewOnly: false,
          configKey: 0,
          config: {
            0: []
          },
          type: 'matrix',
          readers: [{
            value: this.props.user.uid,
            label: this.props.user.uid
          }],
          owner: this.props.user.uid,
          created: (new Date()).toUTCString()
        });
      } else {
        this.setState({
          viewOnly: true
        });
      }
      const usernames = await fetchUsernames();
      this.setState({
        friends: usernames.map(username => ({
          value: username,
          label: username
        }))
      });
      this.setState({
        user: this.props.user
      });
    } catch (err) {
      console.error(err.message);
    }
  }
  componentDidMount() {
    /* Initial Sizing */
    this.handleResize(true);
    /* Resize listener register */
    window.addEventListener('resize', this.handleResize);
  }
  componentWillUnmount() {
    window.removeEventListener('resize', this.handleResize);
  }
  handleResize = () => {
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
  brewColors = () => {
    let blocks = [];
    let colors = [];
    for (let scales in colorbrewer) {
      for (let degree in colorbrewer[scales]) {
        if (!isNaN(parseFloat(degree)) && !isNaN(degree - 0)) {
          blocks.push(
            <MenuItem
              value={blocks.length}
            >
              <div
                style={{
                  display: 'table',
                  width: '100%'
                }}
              >
                {this.getBlocks(colorbrewer[scales][degree])}
              </div>
            </MenuItem>
          );
          colors.push(colorbrewer[scales][degree]);
        }
      }
    }
    this.setState({
      colorblock: blocks,
      colorarray: colors
    });
  }
  getBlocks = (colors) => {
    let block = [];
    for (let color in colors) {
      block.push(
        <span
          style={{
            width: '20px',
            height: '20px',
            display: 'table-cell',
            backgroundColor: colors[color]
          }}
        >
        </span>
      );
    }
    return block;
  }
  fetchConfigurations = (uid, config) => {
    return window.fetch('/api/v1/users/' + uid + '/configs/' + config, {
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
      response['readers'] = response['readers'].map(friend => ({
        label: friend,
        value: friend
      }));
      this.setState(response);
      let configKey = this.getConfigKey(response['config']); //temp
      this.setState({
        themes: this.getDefaultTheme(response['config'][configKey]),
        viewOnly: response['owner'] !== this.props.user.uid
      });
    });
  }
  getDefaultTheme = (config) => {
    let themes = [];
    for (let item = 0; item < config.length; item++) {
      let color = config[item]['color'];
      themes.push(this.findTheme(color));
    }
    return themes;
  }
  findTheme = (color) => {
    let index = 0;
    for (let theme = 0; theme < this.state.colorarray.length; theme++) {
      let colorbrewer = this.state.colorarray[theme].slice();
      if (colorbrewer.length != color.length) {
        continue;
      } else {
        if (_.isEqual(color.concat().sort(), colorbrewer.sort())) {
          index = theme;
          break;
        }
      }
    }
    return index;
  }
  getConfigKey = (config) => {
    let configKey = Object.keys(config)[0];
    this.setState({
      configKey: configKey
    });
    return configKey;
  }
  handleNameChange = (event) => {
    this.setState({
      name: event.target.value
    });
  }
  handleTextChange = (event, row, key) => {
    this.setState({
      config: update(this.state.config, {
        [this.state.configKey]: {
          [row]: {
            [key]: {
              $set: event.target.value
            }
          }
        }
      })
    });
  }
  removeConfig = (index) => {
    this.setState({
      config: update(this.state.config, {
        [this.state.configKey]: {
          $splice: [[index, 1]]
        }
      }),
      themes: update(this.state.themes, {
        $splice: [[index, 1]]
      })
    });
  }
  makeVisible = (event, checked, index) => {
    this.setState({
      config: update(this.state.config, {
        [this.state.configKey]: {
          [index]: {
            text: {
              $set: checked
            }
          }
        }
      })
    });
  }
  reOrganizeRange = (row) => {
    let config = this.state.config[this.state.configKey][row];
    let length = config['color'].length - 1;
    let range = config['range'];
    let min = range[0] ? bignumber(range[0]) : 0;
    let max = range[range.length - 1] ? bignumber(range[range.length - 1]) : add(min, 1);
    max = number(min) === number(max) ? add(min, 1) : max;

    let diff = subtract(max, min);
    let interval = divide(abs(diff), length); //This forces linearity
    max = number(max);

    let newRange = [];
    let max_true = max >= min ? true : false;
    if (!max_true) {
      for (min; min >= max; min = subtract(min, interval)) {
        newRange.push(number(min));
      }
    } else {
      for (min; min <= max; min = add(min, interval)) {
        newRange.push(number(min));
      }
    }
    this.setState({
      config: update(this.state.config, {
        [this.state.configKey]: {
          [row]: {
            range: {
              $set: newRange
            }
          }
        }
      })
    });
  }
  handleRangeChange = (event, row, type) => {
    if (type != 'max' && type != 'min') {
      return;
    }
    let config = this.state.config[this.state.configKey][row];
    let range = config['range'];
    let max = type == 'max' ? event.target.value : range[range.length - 1];
    let min = type == 'min' ? event.target.value : range[0];

    this.setState({
      config: update(this.state.config, {
        [this.state.configKey]: {
          [row]: {
            range: {
              $set: [min, max]
            }
          }
        }
      })
    });

  }

  generateCards = (configs) => {
    let cards = [];
    if (!configs || configs.length < 1) {
      return cards;
    }
    let config = configs[this.state.configKey];
    if (config && config.length > 0) {
      for (let item in config) {
        let rowNum = parseInt(item) + 1;
        cards.push(
          <Card
            style={{
              padding: '12px',
              marginBottom: '4px'
            }}
          >
            <CardHeader
              style={{
                paddingLeft: '0px',
                paddingTop: '12px',
                paddingBottom: '12px'
              }}
              subheader={'Row ' + rowNum}
            >
            </CardHeader>
            <Divider />
            <CardMedia>
              <TextField
                value={config[item]['category']}
                label='Category'
                fullWidth={true}
                margin='dense'
                onChange={(event) => this.handleTextChange(event, item, 'category')}
              />
              <TextField
                value={config[item]['analysis']}
                label='Assessment'
                fullWidth={true}
                margin='dense'
                onChange={(event) => this.handleTextChange(event, item, 'analysis')}
              />
              <TextField
                value={config[item]['variable']}
                label='Variable'
                fullWidth={true}
                margin='dense'
                onChange={(event) => this.handleTextChange(event, item, 'variable')}
              />
              <TextField
                value={config[item]['label']}
                label='Label'
                fullWidth={true}
                margin='dense'
                onChange={(event) => this.handleTextChange(event, item, 'label')}
              />
              <div>
                <Typography
                  variant="caption"
                >
                  Theme
                                </Typography>
                <Select
                  style={{
                    width: '100%'
                  }}
                  value={item in this.state.themes ? this.state.themes[item] : 0}
                  onChange={(event) => this.handlePaint(event, item)}
                >
                  {this.state.colorblock}
                </Select>
              </div>
              <div
                style={{
                  display: 'table',
                  width: '100%',
                  padding: '4px',
                  marginTop: '8px',
                  marginBottom: '4px'
                }}
              >
                <TextField
                  value={config[item]['range'][0]}
                  label='Min'
                  style={{
                    display: 'table-cell'
                  }}
                  margin='dense'
                  onChange={(event) => this.handleRangeChange(event, item, 'min')}
                />
                <TextField
                  value={config[item]['range'][config[item]['range'].length - 1]}
                  label='Max'
                  style={{
                    display: 'table-cell'
                  }}
                  margin='dense'
                  onChange={(event) => this.handleRangeChange(event, item, 'max')}
                />
              </div>
              <FormControlLabel
                style={{
                  width: '100%',
                  paddingLeft: '4px',
                  paddingTop: '4px',
                  paddingRight: '4px',
                  marginLeft: '4px'
                }}
                control={
                  <Checkbox
                    checkedIcon={<Visibility />}
                    icon={<VisibilityOff />}
                    onChange={(event, isInputChecked) => this.makeVisible(event, isInputChecked, item)}
                    checked={config[item]['text']}
                    style={{
                      width: 'auto',
                      paddingTop: '4px',
                      paddingLeft: '4px',
                      paddingRight: '4px',
                      paddingBottom: '12px'
                    }}
                  />
                }
                label='Display Value'
              />
              <Divider />
            </CardMedia>
            <CardActions
              style={{
                display: 'table',
                width: '100%'
              }}
            >
              <IconButton
                aria-label="copy"
                style={{
                  width: '45%'
                }}
                onClick={() => this.copyConfig(item)}
              >
                <Copy color='#adadad' />
              </IconButton>
              <IconButton
                aria-label="delete"
                style={{
                  width: '45%'
                }}
                onClick={() => this.removeConfig(item)}
              >
                <Delete color='#adadad' />
              </IconButton>
            </CardActions>
          </Card>
        );
      }
    }
    return cards;
  }
  handlePaint = (event, row) => {
    let value = event.target.value
    this.setState({
      themes: update(this.state.themes, {
        [row]: {
          $set: value
        }
      }),
      config: update(this.state.config, {
        [this.state.configKey]: {
          [row]: {
            ['color']: {
              $set: this.state.colorarray[value]
            }
          }
        }
      })
    });
  }
  copyConfig = (index) => {
    let configurationItem = this.state.config[this.state.configKey][index];
    let newConfigIndex = this.state.config[this.state.configKey].length;
    this.setState({
      config: update(this.state.config, {
        [this.state.configKey]: {
          $push: [configurationItem]
        }
      }),
      themes: update(this.state.themes, {
        [newConfigIndex]: {
          $set: this.state.themes[index]
        }
      })
    });
  }
  addConfiguration = () => {
    let newConfigIndex = this.state.config[this.state.configKey].length;
    let configurationItem = {
      _id: newConfigIndex,
      analysis: '',
      category: '',
      color: this.state.colorarray[0],
      label: '',
      range: [0, 1],
      text: false,
      variable: ''
    };

    this.setState({
      config: update(this.state.config, {
        [this.state.configKey]: {
          $push: [configurationItem]
        }
      }),
      themes: update(this.state.themes, {
        [newConfigIndex]: {
          $set: 0
        }
      })
    });
  }
  saveConfiguration = () => {
    let newReaders = this.state.readers.map(o => { return o.value });
    let newConfig = {
      _id: this.state._id,
      config: this.state.config,
      name: this.state.name,
      type: this.state.type,
      readers: newReaders,
      modified: (new Date()).toUTCString()
    };
    return window.fetch('/api/v1/users/' + this.state.user.uid + '/configs', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      credentials: 'same-origin',
      body: JSON.stringify({
        edit: newConfig
      })
    }).then((response) => {
      if (response.status !== 201) {
        return;
      }
      return response.json();
    }).then(() => {
      this.setState({
        snackTime: true
      });
    });
  }
  insertConfiguration = () => {
    let newReaders = this.state.readers.map(o => { return o.value });
    let newConfig = {
      owner: this.state.owner,
      config: this.state.config,
      name: this.state.name,
      type: this.state.type,
      readers: newReaders,
      created: this.state.created
    };
    return window.fetch('/api/v1/users/' + this.state.user.uid + '/configs', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      redirect: 'follow',
      credentials: 'same-origin',
      body: JSON.stringify({
        add: newConfig
      })
    }).then((response) => {
      if (response.status !== 201) {
        return;
      }
      return response.json();
    }).then((response) => {
      this.setState({
        snackTime: true
      });
      if ('uri' in response) {
        window.location.replace(response.uri);
      }
    });
  }
  handleChange = name => value => {
    let uid = this.props.user.uid;
    let names = value.map(o => { return o.value });
    if (names.indexOf(uid) === -1) {
      console.log("Can't delete the owner.");
      return;
    }
    this.setState({
      [name]: value,
    });
  }
  handleCrumbs = () => {
    this.setState({
      snackTime: false
    });
  }
  render() {
    const { classes, theme } = this.props;
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
        style={{
          height: '100%',
          padding: '12px'
        }}
      >
        <IconButton
          href='/u/configure/'
        >
          <Back
            color='#5F7B89'
          />
        </IconButton>
        <TextField
          value={this.state.name}
          placeholder='Configuration Name'
          fullWidth={true}
          onChange={this.handleNameChange}
          margin='normal'
        />
        <Select
          native={true}
          fullWidth={true}
          inputProps={{
            name: 'type',
            id: 'config-type'
          }}
          label='Type'
          value={0}
          disabled={true}
          style={{
            marginTop: '4px',
            marginBottom: '4px'
          }}
        >
          <option key={0} value={0}>
            {this.state.type}
          </option>
        </Select>
        <ReactSelect
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
          value={this.state.readers}
          onChange={this.handleChange('readers')}
          placeholder='Shared with'
          isMulti
        />
        <GridList
          style={{
            overflowY: 'auto',
            overflowX: 'hidden',
            width: '100%',
            height: '100%',
            position: 'relative',
            marginBottom: 0,
            display: 'flex',
            alignItems: 'center',
            padding: '4px'
          }}
          cols={this.state.gridCols}
          cellHeight='auto'
        >
          {this.generateCards(this.state.config)}
        </GridList>
        { !this.state.viewOnly ?
          <div
            style={{
              right: 0,
              bottom: 0,
              position: 'fixed'
            }}
          >
            <Button
              variant='fab'
              style={{
                marginRight: '10px',
                marginBottom: '5px',
                marginLeft: '10px',
                marginTop: '10px'
              }}
              iconStyle={{
                fill: 'rgb(255, 64, 129)'
              }}
              backgroundColor='white'
              onClick={this.addConfiguration}
            >
              <ContentAdd />
            </Button>
            <br />
            {this.props.user.goal == 'add' ?
              <Button
                variant='fab'
                style={{
                  margin: '10px',
                  border: '2px solid rgb(255, 64, 129)'
                }}
                iconStyle={{
                  fill: 'rgb(255, 64, 129)'
                }}
                backgroundColor='white'
                onClick={this.insertConfiguration}
              >
                <Save />
              </Button>
              : <Button
                variant='fab'
                style={{
                  margin: '10px',
                  border: '2px solid rgb(255, 64, 129)'
                }}
                iconStyle={{
                  fill: 'rgb(255, 64, 129)'
                }}
                backgroundColor='white'
                onClick={this.saveConfiguration}
              >
                <Save />
              </Button>}
          </div>
          : null}
        <Snackbar
          open={this.state.snackTime}
          message="Your configuration has been updated."
          autoHideDuration={2000}
          onRequestClose={this.handleCrumbs}
        />
      </div>
    );
  }
}

const mapStateToProps = (state) => ({
  user: state.user
});

export default compose(
  withStyles(styles, { withTheme: true }),
  connect(mapStateToProps)
)(EditConfig);
