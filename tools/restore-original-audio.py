"""Render the original HTML WebAudio sound/noise parameters as native WAV assets."""
import math, random, struct, wave
from pathlib import Path
RATE = 44100
DEST = Path(__file__).resolve().parent.parent / 'assets'
random.seed(32)
def tone(f, d=.08, kind='sine', v=.12):
    out=[]
    for i in range(int(RATE*d)):
        phase=i*f/RATE
        x=math.sin(2*math.pi*phase) if kind=='sine' else (1 if phase%1<.5 else -1) if kind=='square' else 2*(phase%1)-1 if kind=='sawtooth' else 1-4*abs((phase+.25)%1-.5)
        out.append(x*v*(.001/v)**(i/(RATE*d)))
    return out
def noise(d,f,v):
    n=int(RATE*d);w=2*math.pi*f/RATE;a=math.sin(w)/2;b0=a/(1+a);b2=-b0;a1=-2*math.cos(w)/(1+a);a2=(1-a)/(1+a);x1=x2=y1=y2=0;out=[]
    for i in range(n):
        x=(random.random()*2-1)*(1-i/n);y=b0*x+b2*x2-a1*y1-a2*y2;x2=x1;x1=x;y2=y1;y1=y;out.append(y*v)
    return out
def save(name, events):
    n=max(int(t*RATE)+len(x) for t,x in events);mix=[0.0]*n
    for t,x in events:
        offset=int(t*RATE)
        for i,v in enumerate(x):mix[offset+i]+=v
    with wave.open(str(DEST/('original-'+name+'.wav')),'wb') as file:
        file.setparams((1,2,RATE,n,'NONE','not compressed'));file.writeframes(b''.join(struct.pack('<h',round(max(-1,min(1,x))*32767)) for x in mix))
save('roll',[(i*.075,noise(.04,2500+random.randint(1,6)*300,.5)) for i in range(9)]+[(.675,tone(660,.15))])
save('spray',[(0,noise(.4,5000,.5))])
save('crash',[(0,noise(.6,500,.9)),(0,tone(140,.4)),(0,tone(70,.5))])
save('fall',[(i*.11,tone(f,.12,'sawtooth')) for i,f in enumerate([500,420,340,260])]+[(0,tone(110,.45,'sawtooth'))])
save('win',[(i*.13,tone(f,.2,'triangle',.18)) for i,f in enumerate([523,659,784,1047,784,1047,1319])])
save('lose',[(i*.22,tone(f,.28,'sawtooth',.1)) for i,f in enumerate([392,370,330,294,196])])
for j,notes in enumerate([[660,880],[440,370],[800,1050,800,1150]]):save('mood'+str(j),[(i*.11,tone(f,.12,'sawtooth' if j==2 else 'triangle',.1)) for i,f in enumerate(notes)])
save('heartbeat',[(0,tone(55,.14,'sine',.35)),(.15,tone(48,.16,'sine',.3))])
save('danger',[(0,tone(900,.1,'square'))])
scale=[261.6,293.7,329.6,392,440,523.3];pattern=[0,2,4,2,1,3,5,3];music=[]
for i in range(16):
    f=scale[pattern[i%8]]*(1 if i<8 else .75);music.append((i*.3,tone(f,.2,'triangle',.03)))
    if i%4==0:music.append((i*.3,tone(f/4,.3,'sine',.05)))
music.append((4.8,[0]));save('music',music)
print('Rendered original sound cues in',DEST)
