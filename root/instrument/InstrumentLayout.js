/*
 * @flow
 * Copyright (C) 2018 MetaBrainz Foundation
 *
 * This file is part of MusicBrainz, the open internet music database,
 * and is licensed under the GPL version 2, or (at your option) any
 * later version: http://www.gnu.org/licenses/gpl-2.0.txt
 */

import React from 'react';
import type {Node as ReactNode} from 'react';

import Layout from '../layout';
import InstrumentSidebar from '../layout/components/sidebar/InstrumentSidebar';
import localizeInstrumentName from '../static/scripts/common/i18n/localizeInstrumentName';


import InstrumentHeader from './InstrumentHeader';

type Props = {|
  +children: ReactNode,
  +entity: InstrumentT,
  +fullWidth?: boolean,
  +page: string,
  +title?: string,
|};

const InstrumentLayout = ({
  children,
  entity: instrument,
  fullWidth,
  page,
  title,
}: Props) => (
  <Layout
    title={title
      ? hyphenateTitle(localizeInstrumentName(instrument), title)
      : localizeInstrumentName(instrument)}
  >
    <div id="content">
      <InstrumentHeader instrument={instrument} page={page} />
      {children}
    </div>
    {fullWidth ? null : <InstrumentSidebar instrument={instrument} />}
  </Layout>
);


export default InstrumentLayout;
