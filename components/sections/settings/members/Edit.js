const React = require('react');
const bs = require('react-bootstrap');
const { FormattedMessage } = require('react-intl');

const MainSection = require('../../../layout/MainSection');
const FormFields = require('./FormFields');

const { PNG_IMAGES, BASE64 } = require('../../../../constants/HomeConstants');


function EditMembers(props) {
  const { _t, location, errors, members, memberForm, active: activeMemberIndex, mode, actions } = props;
  const { fetchProfile, updateMemberForm, clearMemberForm, setError, dismissError, confirmEditMember, confirmDeleteMember } = actions;
  return (
    <MainSection id="section.members">
      <div>
        <bs.Accordion 
          className="col-md-10" 
          animation={false}
          expanded
          onSelect={(val) => {
            updateMemberForm(members.find(member => member.index === val));
          }}
        >
          {
            members.map(member => ( 
              <bs.Panel 
                key={member.index}
                eventKey={member.index}
                header={
                  <h3>
                    { member.photo ? 
                    <img 
                      style={{ 
                        height: 30,
                        width: 30,
                        marginRight: 10,
                        border: '1px #2D3580 solid',
                      }} 
                      src={`${BASE64}${member.photo}`} 
                      alt="member" 
                    />
                    :
                    <img 
                      style={{ 
                        height: 30,
                        width: 30,
                        marginRight: 10,
                        border: '1px #2D3580 solid',
                      }} 
                      src={`${PNG_IMAGES}/daiad-consumer.png`} 
                      alt="member" 
                    />
                    }
                    {member.name || _t('forms.noname')}
                  </h3> 
                }
              >
              <div>
                <form 
                  id="form-edit-member" 
                  onSubmit={(e) => { 
                    e.preventDefault();
                    confirmEditMember(memberForm); 
                  }}
                >
                  <FormFields
                    _t={_t}
                    errors={errors}
                    member={memberForm}  
                    updateMemberForm={updateMemberForm}
                    fetchProfile={fetchProfile}
                    setError={setError}
                    dismissError={dismissError}
                  />
            
                  <div>
                    <button
                      type="submit" 
                      className="btn"
                      style={{ float: 'right', marginRight: 10 }} 
                    >
                      <FormattedMessage id="forms.update" />
                    </button>
                    {
                      member.index !== 0 ?
                        <button 
                          style={{ float: 'right', marginRight: 10 }} 
                          className="btn"
                          bsStyle="danger"
                          onClick={(e) => { 
                            e.preventDefault();
                            confirmDeleteMember(memberForm);
                          }}
                        >
                          <FormattedMessage id="forms.delete" />
                        </button>
                        :
                          <span />
                   }
                  </div>
              </form>
            </div>
          </bs.Panel>
          ))
          }
        </bs.Accordion>
      </div>
    </MainSection>
  );
}

module.exports = EditMembers;
