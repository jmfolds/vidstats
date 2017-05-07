require('./heatmap');
import React from 'react';
import render from 'react-dom';
import ProgressBar from './ProgressBar.jsx'

export default class HeatMap extends React.Component {
    render() {
        let els = [];
        let obj = {};
        let totalLength = 0;
        this.props.playedLengths.forEach((pl, idx) => {
            const plEls = [];
            const total = this.props.duration;
            const prev = this.props.playedLengths[idx-1];
            const next = this.props.playedLengths[idx+1];
            let length = pl.end-pl.start;
            totalLength += length;
            // check if we skipped a section since last played obj
            if (prev && prev.end !== pl.start) {
                plEls.push(<ProgressBar percent={((pl.start - prev.end) / total) * 100} color="opaque" />);
            }
            // add current played progress
            plEls.push(<ProgressBar percent={(length / total) * 100} color="success" />);
            // check if no more played objs, and we still haven't hit 100%
            if (!next && totalLength !== this.props.duration) {
                plEls.push(<ProgressBar percent={((total - pl.end) / total) * 100} color="opaque" />);
            }
            els.push(plEls);
        });
        return (
            <div className="heatmap-container">
                {els}
            </div>
        )
    }
}