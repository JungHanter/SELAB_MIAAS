#!/usr/bin/env python
import numpy as np
import edflib
from stacklineplot import stackplot, figure, plot, title, grid
from pylab import *
e = edflib.EdfReader("/Users/hanter/Downloads/dicom_ex/SC4001E0-PSG.edf")


signal_labels = []
signal_nsamples = []
def fileinfo(edf):
    print "datarecords_in_file", edf.datarecords_in_file
    print "signals_in_file:", edf.signals_in_file
    for ii in range(edf.signals_in_file):
        signal_labels.append(edf.signal_label(ii))
        print "signal_label(%d)" % ii, edf.signal_label(ii),
        print edf.samples_in_file(ii), edf.samples_in_datarecord(ii),
        signal_nsamples.append(edf.samples_in_file(ii))
        print edf.samplefrequency(ii)

fileinfo(e)
sig1 = np.zeros(2000.0, dtype='float64')
e.readsignal(1,0, 2000, sig1)

nsigs = e.signals_in_file
MAXSIGLEN = 20000
sigbufs = np.zeros((nsigs,MAXSIGLEN), dtype='float64')
# read the first 10 sec
readpt = 0
for ii in range(nsigs):
    e.readsignal(ii, readpt, 2000, sigbufs[ii])

# stackplot(sigbufs,seconds=10.0, start_time=0.0, ylabels=signal_labels)

def readsignals(edf, start_time, end_time, buf=None):
    """times in seconds"""
    # assume same sampling rate for all channels for a moment and use signal#0
    assert end_time <= edf.file_duration
    
    readpt = int(edf.samplefrequency(0)*(start_time))
    print "readpt:", readpt
    readlen = int( edf.samplefrequency(0)*(end_time-start_time))
    assert readlen <= MAXSIGLEN
    print "readlen:", readlen
    for ii in range(nsigs):
        e.readsignal(ii, readpt, readlen, sigbufs[ii])
    return readpt, readlen
L = 8.0
s,l = readsignals(e, 0, L)
stackplot(sigbufs[:, s:s+l], seconds = L, ylabels=signal_labels)

# findx2 = [ (ii, signal_labels[ii]) for ii in range(len(signal_labels))] 
# X2 is signal 27
# A2 is signal 23

print sigbufs

ekg = sigbufs[27][0:l] - sigbufs[23][0:l]
# L  = e.samples_in_file(27)
# x1s= 27; a2s = 23
# X1 = np.zeros(L,dtype='float64')
# A2 = np.zeros(L,dtype='float64')
# t = np.arange(L,dtype='float64')/e.samplefrequency(x1s)
# e.readsignal(x1s,0, L, X1)
# e.readsignal(a2s,0, L, A2)
# ekg = X1-A2

from scipy.signal import kaiserord, lfilter, firwin, freqz
# lowpass filter

sample_rate = e.samplefrequency(0)
nyq_rate = sample_rate/2.0
width = 5.0/nyq_rate
ripple_db = 60.0
N, beta = kaiserord(ripple_db, width)
cutoff_hz = 10.0
taps = firwin(N, cutoff_hz/nyq_rate, window=('kaiser', beta))
filtered_ekg = lfilter(taps, 1.0, ekg)
figure()
plot(taps, 'bo-', linewidth=2)
title('Filter Coefficients (%d taps)' % N)
grid(True)

phase_delay = 0.5 * (N-1) / sample_rate
t = np.arange(len(ekg))/sample_rate
figure()
plot(t,ekg)
filtered_ekg[0:N-1] = 0 # the first N-1 samples are corrupted
plot(t-phase_delay, filtered_ekg)


#high pass filter
import scipy.signal as signal

coeff=signal.iirfilter(2, 10.0, btype='highpass') 
