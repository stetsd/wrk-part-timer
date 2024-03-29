import React, {Component} from 'react';
import PropTypes from 'prop-types';
import {connect, dispatch} from 'react-redux';
import {Form, Radio, Input, Button} from 'semantic-ui-react';
import {changeMode, changeTimerTime, error, newAudioEnd} from './actions';
import {stop} from '../controls/actions';
import timerMech from '../../timerMechObject';
import './style.scss';

//Electron mech
const {remote} = require('electron'),
        {dialog} = remote;
const fs = require('fs');
const path = require('path');
const {config} = require('../../../../config');

class Settings extends Component{
    constructor(props){
        super(props);
        this.handleChangeMode = this.handleChangeMode.bind(this);
        this.handleChangeTime = this.handleChangeTime.bind(this);
        this.handleOpenDialogAlarm = this.handleOpenDialogAlarm.bind(this);
        this.state = {
            timerTime: {
                H: 0,
                M: 0,
                S: 0
            }
        }
    }

    static propTypes = {
        dispatch: PropTypes.func.isRequired
    }

    handleOpenDialogAlarm(){
        dialog.showOpenDialog({
            filters: [{name: 'Audio', extensions: ['mp3', 'wav', 'ogg']}],
            title: 'Select Audio',
            defaultPath: process.env.HOME,
            properties: ['openFile']
        }, file => {
            if(!file){return false}
            let readSt = fs.createReadStream(file[0]);
            let {base, ext} = path.parse(readSt.path);

            if(!config.audioTypes[ext]){
                this.props.dispatch(error(config.msg.err.badAudioType));
                return false;
            }

            let newPath = path.normalize(`${global.__dirname}/public/assets/${base}`);
            let writeSt = fs.createWriteStream(newPath);
            var size = 0;

            readSt
                .on('data', data => {
                    size += data.length;
                    if(size > config.endAlarmSizeLimit){
                        writeSt.destroy();
                        if(fs.existsSync(newPath)){
                            fs.unlinkSync(newPath);
                            this.props.dispatch(error(config.msg.err.alarmLimit));
                        }
                        throw new Error(config.msg.err.alarmLimit);
                    }
                })
                .pipe(writeSt);

            writeSt
                .on('finish', () => {
                    fs.existsSync(newPath) && this.props.dispatch(newAudioEnd(newPath));
                });
        });
    }

    handleChangeMode(e, {value}){
		this.props.dispatch(changeMode(value));
        this.props.dispatch(stop());
        timerMech.destroyAll();
    }

    handleChangeTime(e, elem){
        let {name, value} = elem;
        this.props.dispatch(changeTimerTime(name, value));

        let timerTime = this.state.timerTime;
        timerTime[name] = +value;
        this.setState({timerTime});
    }

    componentDidUpdate(){
        this.props.mode === 'timer-chain' && this.props.dispatch(error(config.msg.warning.modeTimeChain));
    }

    render(){
        let {mode, timerTime, ctrlPause} = this.props;

        return(
            <div className="app__settings">
                <Form>
                    <div className="app__main-settings">
                        <Form.Field><strong>Select mode</strong></Form.Field>
                        <Form.Field>
                            <Radio label="Timer" onChange={this.handleChangeMode} checked={mode === 'timer'} name="appMode" value="timer"></Radio>
                        </Form.Field>
                        <Form.Field>
                            <Radio label="Timer-Chain" onChange={this.handleChangeMode} checked={mode === 'timer-chain'} name="appMode" value="timer-chain"></Radio>
                        </Form.Field>
                        <Form.Field>
                            <Radio label="Stopwatch" onChange={this.handleChangeMode} checked={mode === 'stopwatch'} name="appMode" value="stopwatch"></Radio>
                        </Form.Field>
                    </div>

                    <div className="app__main-sub-settings">
                        {/* Timeout mode */}
                        {mode === 'timer' ?
                            <Form.Group className="app__settings-time">
                                <Form.Field>
                                    <label>H</label>
                                    <Input type="number" disabled={ctrlPause} onChange={this.handleChangeTime} value={this.state.timerTime.H} min="0" name="H" placeholder="0"/>
                                </Form.Field>
                                <Form.Field>
                                    <label>M</label>
                                    <Input type="number" disabled={ctrlPause} onChange={this.handleChangeTime} value={this.state.timerTime.M} min="0" max="60" name="M" placeholder="0"/>
                                </Form.Field>
                                <Form.Field>
                                    <label>S</label>
                                    <Input type="number" disabled={ctrlPause} onChange={this.handleChangeTime} value={this.state.timerTime.S} min="0" max="60" name="S" placeholder="0"/>
                                </Form.Field>
                            </Form.Group> : null
                        }


                        {/* Set Interval */}
                        {mode === 'timer-chain' ?
                            <Form.Group>
                                <Form.Field>
                                    <Button>Set Chain</Button>
                                </Form.Field>
                            </Form.Group> : null
                        }


                        {/* Set alarm */}
                        {mode === 'timer' ?
                            <Form.Group className="app__settings-set-alarm">
                                <Form.Field>
                                    <Button onClick={this.handleOpenDialogAlarm}>Set Alarm</Button>
                                </Form.Field>
                            </Form.Group> : null
                        }
                    </div>
                </Form>
            </div>
        )
    }
}


let appState = (state) => {
	return {
		mode: state.appReducer.mode,
        timerTime: state.appReducer.timerTime,
        ctrlPause: state.appReducer.ctrlPause
	}
};

export default connect(appState)(Settings)
