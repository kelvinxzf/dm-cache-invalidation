/* 
* <license header>
*/

import React, { useState } from 'react'
import PropTypes from 'prop-types'
import ErrorBoundary from 'react-error-boundary'
import {
  Flex,
  Heading,
  Form,
  Picker,
  TextArea,
  Button,
  ProgressCircle,
  Item,
  Text,
  View
} from '@adobe/react-spectrum'

import actions from '../config.json'
import { actionWebInvoke } from '../utils'

const ActionsForm = (props) => {
  const [state, setState] = useState({
    actionSelected: null,
    actionResponse: null,
    actionResponseError: null,
    actionHeaders: null,
    actionHeadersValid: null,
    actionParams: null,
    actionParamsValid: null,
    actionInvokeInProgress: false
  })

  return (
    <View width="size-6000">
      <Heading level={1}>Run your application backend actions</Heading>
      {Object.keys(actions).length > 0 && (
        <Form necessityIndicator="label">
          <Picker
            label="Actions"
            isRequired={true}
            placeholder="select an action"
            aria-label="select an action"
            items={Object.keys(actions).map((k) => ({ name: k }))}
            itemKey="name"
            onSelectionChange={(name) =>
              setState({
                ...state,
                actionSelected: name,
                actionResponseError: null,
                actionResponse: null
              })
            }
          >
            {(item) => <Item key={item.name}>{item.name}</Item>}
          </Picker>

          <TextArea
            label="headers"
            placeholder='{ "key": "value" }'
            validationState={state.actionHeadersValid}
            onChange={(input) =>
              setJSONInput(input, 'actionHeaders', 'actionHeadersValid')
            }
          />

          <TextArea
            label="params"
            placeholder='{ "key": "value" }'
            validationState={state.actionParamsValid}
            onChange={(input) =>
              setJSONInput(input, 'actionParams', 'actionParamsValid')
            }
          />
          <Flex>
            <Button
              variant="primary"
              onPress={invokeAction.bind(this)}
              isDisabled={!state.actionSelected}
            >
              Invoke
            </Button>

            <ProgressCircle
              aria-label="loading"
              isIndeterminate
              isHidden={!state.actionInvokeInProgress}
              marginStart="size-100"
            />
          </Flex>
        </Form>
      )}

      {state.actionResponseError && (
        <View backgroundColor={`negative`} padding={`size-100`} marginTop={`size-100`} marginBottom={`size-100`} borderRadius={`small `}>
          <Text>Failure! See the error in your browser console.</Text>
        </View>
      )}
      {!state.actionResponseError && state.actionResponse && (
        <View backgroundColor={`positive`} padding={`size-100`} marginTop={`size-100`} marginBottom={`size-100`} borderRadius={`small `}>
          <Text>Success! See the response content in your browser console.</Text>
        </View>
      )}

      {Object.keys(actions).length === 0 && <Text>You have no actions !</Text>}
    </View>
  )

  // Methods

  // parses a JSON input and adds it to the state
  async function setJSONInput (input, stateJSON, stateValid) {
    let content
    let validStr = null
    if (input) {
      try {
        content = JSON.parse(input)
        validStr = 'valid'
      } catch (e) {
        content = null
        validStr = 'invalid'
      }
    }
    setState({ ...state, [stateJSON]: content, [stateValid]: validStr })
  }

  // invokes a the selected backend actions with input headers and params
  async function invokeAction () {
    setState({ ...state, actionInvokeInProgress: true })
    const action = state.actionSelected
    const headers = state.actionHeaders || {}
    const params = state.actionParams || {}

    // all headers to lowercase
    Object.keys(headers).forEach((h) => {
      const lowercase = h.toLowerCase()
      if (lowercase !== h) {
        headers[lowercase] = headers[h]
        headers[h] = undefined
        delete headers[h]
      }
    })
    // set the authorization header and org from the ims props object
    if (props.ims.token && !headers.authorization) {
      headers.authorization = `Bearer ${props.ims.token}`
    }
    if (props.ims.org && !headers['x-gw-ims-org-id']) {
      headers['x-gw-ims-org-id'] = props.ims.org
    }
    try {
      // invoke backend action
      const actionResponse = await actionWebInvoke(action, headers, params)
      // store the response
      setState({
        ...state,
        actionResponse,
        actionResponseError: null,
        actionInvokeInProgress: false
      })
      console.log(`Response from ${action}:`, actionResponse)
    } catch (e) {
      // log and store any error message
      console.error(e)
      setState({
        ...state,
        actionResponse: null,
        actionResponseError: e.message,
        actionInvokeInProgress: false
      })
    }
  }
}

ActionsForm.propTypes = {
  runtime: PropTypes.any,
  ims: PropTypes.any
}

export default ActionsForm
