import { TrackClient } from '@/components/track-client';
export default function TrackPage(){
  return <div className="simple-page"><div className="container narrow"><div className="section-kicker">YOUR REQUEST</div><h1>Track a booking</h1><p>Check the latest approval status using your private tracking link.</p><TrackClient/></div></div>;
}
