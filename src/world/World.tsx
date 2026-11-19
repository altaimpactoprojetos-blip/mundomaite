import { BUILDINGS, PROPERTIES } from '../data/world';
import { Building } from './Building';
import { House } from './House';
import { DayNight, Ground, Sky } from './Environment';
import { Nature } from './Nature';
import { Plaza, Beach, Port, Condo, Castle, FutureCity, Airport, Islands } from './Zones';
import { AmusementPark, Farm } from './Park';
import { Traffic } from './Traffic';
import { CityDetails } from './CityDetails';

export function World() {
  return (
    <>
      <DayNight />
      <Sky />
      <Ground />
      <Nature />
      <CityDetails />
      {BUILDINGS.map((b) => <Building key={b.id} b={b} />)}
      {PROPERTIES.map((p) => <House key={p.id} def={p} />)}
      <Plaza />
      <Beach />
      <Port />
      <Condo />
      <Castle />
      <FutureCity />
      <Airport />
      <Islands />
      <AmusementPark />
      <Farm />
      <Traffic />
    </>
  );
}
