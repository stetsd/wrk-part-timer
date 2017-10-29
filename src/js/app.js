import React, {Component} from 'react';
import {connect, dispatch} from 'react-redux';
import {Timer, Settings, Values, Controls} from './components/';


class App extends Component{
    constructor(props){
        super(props);
    };

    render(){
        return(
            <div className="app">
				<div className="app__inner">
					<Settings/>
                	<Timer/>
                    <Values/>
					<Controls/>
				</div>
            </div>
        )
    }
}

export default connect(state => state)(App);
