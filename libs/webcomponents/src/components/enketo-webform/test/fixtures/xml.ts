export const submission = `
<aM3XZ9L3BCjqDVq7CeutZ6
	xmlns:jr="http://openrosa.org/javarosa"
	xmlns:orx="http://openrosa.org/xforms" id="aM3XZ9L3BCjqDVq7CeutZ6" version="1 (2023-05-15 21:49:49)">
	<start_time>2023-05-15T23:12:40.585+01:00</start_time>
	<end_time>2023-05-15T23:43:14.815+01:00</end_time>
	<today>2023-05-15</today>
	<imei>ee.kobotoolbox.org:nDEnsue5oPp1fSaG</imei>
	<phonenumber>phonenumber not found</phonenumber>
	<name>chris</name>
	<age>1</age>
	<gender/>
	<photo/>
	<date/>
	<location/>
	<pizza_fan/>
	<thanks/>
	<net_worth/>
	<a_group>
		<a_text/>
	</a_group>
	<meta>
		<instanceID>uuid:afca73df-a61c-440b-9be2-a904700c66df</instanceID>
		<rootUuid>7cde9418-700b-4254-8844-17b9799f2706</rootUuid>
		<deprecatedID>uuid:7cde9418-700b-4254-8844-17b9799f2706</deprecatedID>
	</meta>
	<formhub>
		<uuid>3b3f8aa41a6d49379f90bb9e39bd9827</uuid>
	</formhub>
	<__version__>v6sDQRzLKXEHQr9t7huv99</__version__>
</aM3XZ9L3BCjqDVq7CeutZ6>`;

export const submissionJSON = {
  aM3XZ9L3BCjqDVq7CeutZ6: {
    start_time: '2023-05-15T23:12:40.585+01:00',
    end_time: '2023-05-15T23:43:14.815+01:00',
    today: '2023-05-15',
    imei: 'ee.kobotoolbox.org:nDEnsue5oPp1fSaG',
    phonenumber: 'phonenumber not found',
    name: 'chris',
    age: 1,
    gender: '',
    photo: '',
    date: '',
    location: '',
    pizza_fan: '',
    thanks: '',
    net_worth: '',
    a_group: { a_text: '' },
    meta: {
      instanceID: 'uuid:afca73df-a61c-440b-9be2-a904700c66df',
      rootUuid: '7cde9418-700b-4254-8844-17b9799f2706',
      deprecatedID: 'uuid:7cde9418-700b-4254-8844-17b9799f2706',
    },
    formhub: { uuid: '3b3f8aa41a6d49379f90bb9e39bd9827' },
    __version__: 'v6sDQRzLKXEHQr9t7huv99',
  },
};

export const responseSuccess = `<OpenRosaResponse
xmlns="http://openrosa.org/http/response">
<message>Successful submission.</message>
<submissionMetadata
  xmlns="http://www.opendatakit.org/xforms" id="aM3XZ9L3BCjqDVq7CeutZ6"  instanceID="uuid:afca73df-a61c-440b-9be2-a904700c66df" submissionDate="2023-05-15T23:46:03.621333+00:00" isComplete="true" markedAsCompleteDate="2023-05-15T23:46:03.621349+00:00"/>
</OpenRosaResponse>`;

export const responseDuplicate = `<?xml version='1.0' encoding='UTF-8' ?>
<OpenRosaResponse
	xmlns="http://openrosa.org/http/response">
	<message nature="">Duplicate submission</message>
</OpenRosaResponse>`;
