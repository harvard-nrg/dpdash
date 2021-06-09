import React, { Component } from 'react';
import { connect } from 'react-redux';
import { compose } from 'redux';

import Typography from '@material-ui/core/Typography';
import List from '@material-ui/core/List';
import ListItem from '@material-ui/core/ListItem';
import ListItemIcon from '@material-ui/core/ListItemIcon';
import ListItemText from '@material-ui/core/ListItemText';
import Divider from '@material-ui/core/Divider';

import Home from '@material-ui/icons/Home';
import Person from '@material-ui/icons/Person';
import ColorLens from '@material-ui/icons/ColorLens';
import ExitToApp from '@material-ui/icons/ExitToApp';
import Settings from '@material-ui/icons/Settings';

class DrawerComponent extends Component {
  constructor(props) {
    super(props);
    this.state = {
    };
  }
  componentDidUpdate() {
  }
  render() {
    return (
      <div>
        <div
          style={{
            padding: '4px'
          }}
        >
          <div
            style={{
              height: '12px'
            }}
          >
          </div>
          <div
            style={{
              display: 'flex',
              flexFlow: 'row wrap',
              justifyContent: 'center',
              alignContent: 'center',
              alignItems: 'center',
              width: '100%',
              height: '18px'
            }}
          >
            <img style={{ height: '100%' }} src='/img/dpdash.png' />
          </div>
          <div
            style={{
              height: '16px'
            }}
          >
          </div>
          <div
            style={{
              width: '100%',
              display: 'flex',
              flexFlow: 'row wrap',
              justifyContent: 'center',
              alignContent: 'center',
              alignItems: 'center'
            }}
          >
            {this.props.avatar}
          </div>
          <div
            style={{
              height: '8px'
            }}
          >
          </div>
          <div
            style={{
              width: '100%',
              textAlign: 'center'
            }}
          >
            <Typography
              noWrap={true}
            >
              {this.props.name ? this.props.name : this.props.user.uid}
            </Typography>
          </div>
          <div
            style={{
              height: '12px'
            }}
          >
          </div>
          <div
            style={{
              width: '100%',
            }}
          >
            <table
              style={{
                width: '100%',
                padding: '4px',
                textAlign: 'center'
              }}
            >
              <tr>
                <td style={{ width: '30%' }}>
                  <Typography
                    noWrap={true}
                    style={{
                      fontWeight: 'bold'
                    }}
                  >
                    {this.props.totalStudies}
                  </Typography>
                </td>
                <td style={{ width: '30%' }}>
                  <Typography
                    noWrap={true}
                    style={{
                      fontWeight: 'bold'
                    }}
                  >
                    {this.props.totalSubjects}
                  </Typography>
                </td>
                <td style={{ width: '30%' }}>
                  <Typography
                    noWrap={true}
                    style={{
                      fontWeight: 'bold'
                    }}
                  >
                    {this.props.totalDays}
                  </Typography>
                </td>
              </tr>
              <tr>
                <td style={{ width: '30%' }}>
                  <Typography
                    noWrap={true}
                    style={{
                      color: 'rgba(0, 0, 0, 0.75)'
                    }}
                  >
                    {'studies'}
                  </Typography>
                </td>
                <td style={{ width: '30%' }}>
                  <Typography
                    noWrap={true}
                    style={{
                      color: 'rgba(0, 0, 0, 0.75)'
                    }}
                  >
                    {'subjects'}
                  </Typography>
                </td>
                <td style={{ width: '30%' }}>
                  <Typography
                    noWrap={true}
                    style={{
                      color: 'rgba(0, 0, 0, 0.75)'
                    }}
                  >
                    {'days'}
                  </Typography>
                </td>
              </tr>
            </table>
          </div>
        </div>
        <Divider />
        <List
          dense={true}
        >
          <ListItem
            button={true}
            component='a'
            href="/"
          >
            <ListItemIcon>
              <Home style={{ color: '#97C0CE' }} />
            </ListItemIcon>
            <ListItemText primary="Home" />

          </ListItem>
          <ListItem
            button={true}
            component='a'
            href="/u"
          >
            <ListItemIcon>
              <Person style={{ color: '#97C0CE' }} />
            </ListItemIcon>
            <ListItemText primary="Account" />

          </ListItem>
          <ListItem
            button={true}
            component='a'
            href="/u/configure"
          >
            <ListItemIcon>
              <ColorLens style={{ color: '#97C0CE' }} />
            </ListItemIcon>
            <ListItemText primary="Configure" />

          </ListItem>
          {this.props.user.role == 'admin' ?
            <ListItem
              button={true}
              component='a'
              href="/admin"
            >
              <ListItemIcon>
                <Settings style={{ color: '#97C0CE' }} />
              </ListItemIcon>
              <ListItemText primary="Admin" />

            </ListItem> :
            null}
          <ListItem
            button={true}
            component='a'
            href="/logout"
          >
            <ListItemIcon>
              <ExitToApp style={{ color: '#97C0CE' }} />
            </ListItemIcon>
            <ListItemText primary="Logout" />

          </ListItem>
        </List>
      </div>
    );
  }
}
const mapStateToProps = (state) => ({
  user: state.user
});

export default compose(
  connect(mapStateToProps)
)(DrawerComponent);
