# Set up directories
            mkdir -p /etc/hyperledger/fabric-ca-client
            export FABRIC_CA_CLIENT_HOME=/etc/hyperledger/fabric-ca-client

            # 1. ENROLL CA ADMIN
            echo "Enrolling CA Admin..."
            fabric-ca-client enroll -u http://admin:adminpw@fabric-ca:7054

            # 2. PEER ENROLLMENT
            echo "Registering peer0.{{ORG_ID}}..."
            fabric-ca-client register --id.name peer0.{{ORG_ID}} --id.secret peer0pw --id.type peer --id.attrs '"hf.Registrar.Roles=peer,client"'
            
            # MSP Enrollment
            fabric-ca-client enroll -u http://peer0.{{ORG_ID}}:peer0pw@fabric-ca:7054 \
              -M /etc/hyperledger/fabric/crypto-config/peerOrganizations/{{ORG_ID}}.example.com/peers/peer0.{{ORG_ID}}.example.com/msp
            
            # TLS Enrollment
            fabric-ca-client enroll -u http://peer0.{{ORG_ID}}:peer0pw@fabric-ca:7054 \
              --enrollment.profile tls \
              -M /etc/hyperledger/fabric/crypto-config/peerOrganizations/{{ORG_ID}}.example.com/peers/peer0.{{ORG_ID}}.example.com/tls \
              --csr.hosts peer0.{{ORG_ID}}.example.com

            # 3. ORDERER ENROLLMENT (create one orderer per peer org)
            ORDERER_NUM=$(echo "{{ORG_ID}}" | sed 's/org//')  # Extracts 1, 2, or 3 from org1, org2, org3
            ORDERER_NAME="orderer${ORDERER_NUM}"
            
            echo "Registering ${ORDERER_NAME}..."
            fabric-ca-client register --id.name ${ORDERER_NAME} --id.secret ordererpw --id.type orderer
              
            # Orderer MSP
            fabric-ca-client enroll -u http://${ORDERER_NAME}:ordererpw@fabric-ca:7054 \
              -M /etc/hyperledger/fabric/crypto-config/ordererOrganizations/example.com/orderers/${ORDERER_NAME}.example.com/msp
            
            # Orderer TLS
            fabric-ca-client enroll -u http://${ORDERER_NAME}:ordererpw@fabric-ca:7054 \
              --enrollment.profile tls \
              -M /etc/hyperledger/fabric/crypto-config/ordererOrganizations/example.com/orderers/${ORDERER_NAME}.example.com/tls \
              --csr.hosts ${ORDERER_NAME}.example.com

            # Create Orderer Org MSP config (only once)
            if [ "{{ORG_ID}}" = "org1" ]; then
              mkdir -p /etc/hyperledger/fabric/crypto-config/ordererOrganizations/example.com/msp
              cat > /etc/hyperledger/fabric/crypto-config/ordererOrganizations/example.com/msp/config.yaml <<EOF
              NodeOUs:
                Enable: true
                ClientOUIdentifier:
                  Certificate: cacerts/*.pem
                  OrganizationalUnitIdentifier: client
                PeerOUIdentifier:
                  Certificate: cacerts/*.pem
                  OrganizationalUnitIdentifier: peer
                AdminOUIdentifier:
                  Certificate: cacerts/*.pem
                  OrganizationalUnitIdentifier: admin
                OrdererOUIdentifier:
                  Certificate: cacerts/*.pem
                  OrganizationalUnitIdentifier: orderer
            EOF
            fi

            # 4. CREATE PEER ORG CONFIG.YAML
            cat > /etc/hyperledger/fabric/crypto-config/peerOrganizations/{{ORG_ID}}.example.com/msp/config.yaml <<EOF
            NodeOUs:
              Enable: true
              ClientOUIdentifier:
                Certificate: cacerts/*.pem
                OrganizationalUnitIdentifier: client
              PeerOUIdentifier:
                Certificate: cacerts/*.pem
                OrganizationalUnitIdentifier: peer
              AdminOUIdentifier:
                Certificate: cacerts/*.pem
                OrganizationalUnitIdentifier: admin
              OrdererOUIdentifier:
                Certificate: cacerts/*.pem
                OrganizationalUnitIdentifier: orderer
            EOF

            echo "Enrollment completed for {{ORG_ID}}!"