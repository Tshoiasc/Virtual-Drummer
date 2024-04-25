import os
import numpy as np
import librosa
from sklearn.model_selection import train_test_split
from sklearn.metrics import accuracy_score, precision_score, recall_score, f1_score, confusion_matrix
import seaborn as sns
import matplotlib.pyplot as plt
from keras.models import Sequential
from keras.layers import Dense, Dropout, Flatten, Activation, Conv2D, MaxPooling2D
from keras.utils import to_categorical


def construct_model():
    cnn_model_l = Sequential()
    cnn_model_l.add(Conv2D(32, (2, 2), input_shape=(20, 30, 1)))
    cnn_model_l.add(Activation('relu'))
    cnn_model_l.add(Conv2D(32, (2, 2)))
    cnn_model_l.add(Activation('relu'))
    cnn_model_l.add(MaxPooling2D(pool_size=(2, 2)))
    cnn_model_l.add(Dropout(0.25))

    cnn_model_l.add(Conv2D(64, (2, 2)))
    cnn_model_l.add(Activation('relu'))
    cnn_model_l.add(Conv2D(64, (2, 2)))
    cnn_model_l.add(Activation('relu'))
    cnn_model_l.add(MaxPooling2D(pool_size=(2, 2)))
    cnn_model_l.add(Dropout(0.25))

    cnn_model_l.add(Flatten())
    cnn_model_l.add(Dense(512))
    cnn_model_l.add(Activation('relu'))
    cnn_model_l.add(Dropout(0.5))
    cnn_model_l.add(Dense(10))
    cnn_model_l.add(Activation('softmax'))

    cnn_model_l.compile(loss='categorical_crossentropy', optimizer='adam', metrics=['accuracy'])
    return cnn_model_l


def extract_features(audio_file):
    num_mfcc = 20
    audio_data, sample_rate = librosa.load(audio_file, mono=True, sr=None)
    audio_data = audio_data[::3]
    mfcc_features = librosa.feature.mfcc(y=audio_data, sr=22050, n_mfcc=num_mfcc)

    if mfcc_features.shape[1] < 30:
        mfcc_features = np.pad(mfcc_features, pad_width=((0, 0), (0, 30 - mfcc_features.shape[1])), mode='constant')
    else:
        mfcc_features = mfcc_features[:, :30]

    return mfcc_features


def load_dataset(folder_path, genre_label):
    feature_data = []
    genre_labels = np.zeros((0, 1), dtype='int')
    audio_files = os.listdir(folder_path)

    for idx, audio_file in enumerate(audio_files):
        file_path = folder_path + audio_file
        try:
            mfcc_features = extract_features(file_path)
            feature_data.append(mfcc_features)
            genre_labels = np.vstack((genre_labels, int(genre_label)))
            print(f'{idx + 1}/{len(audio_files)} processed: {file_path}')
        except Exception as e:
            print(f'Error processing file {file_path}: {str(e)}')
            continue

    feature_array = np.array(feature_data)
    return feature_array, genre_labels


def assess_model(trained_model, test_features, test_labels):
    predicted_probabilities = trained_model.predict(test_features)
    predicted_labels = np.argmax(predicted_probabilities, axis=1)

    accuracy = accuracy_score(test_labels, predicted_labels)
    precision = precision_score(test_labels, predicted_labels, average='macro')
    recall = recall_score(test_labels, predicted_labels, average='macro')
    f1 = f1_score(test_labels, predicted_labels, average='macro')

    print(f'Accuracy: {accuracy:.4f}')
    print(f'Precision: {precision:.4f}')
    print(f'Recall: {recall:.4f}')
    print(f'F1 Score: {f1:.4f}')

    confusion_mat = confusion_matrix(test_labels, predicted_labels)
    sns.heatmap(confusion_mat, annot=True, fmt='d', cmap='Blues')
    plt.xlabel('Predicted Label')
    plt.ylabel('True Label')
    plt.show()


if __name__ == '__main__':
    music_genres = ['blues', 'classical', 'country', 'disco', 'hiphop', 'jazz', 'metal', 'pop', 'reggae', 'rock']
    feature_dataset, label_dataset = [], []

    for genre_idx, genre in enumerate(music_genres):
        features, labels = load_dataset(f'wav/{genre}/', genre_idx)
        feature_dataset.append(features)
        label_dataset.append(labels)

    combined_features = np.concatenate(feature_dataset)
    combined_labels = np.concatenate(label_dataset)

    train_features, test_features, train_labels, test_labels = train_test_split(combined_features, combined_labels, random_state=420)

    train_features = train_features.reshape(train_features.shape[0], 20, 30, 1)
    test_features = test_features.reshape(test_features.shape[0], 20, 30, 1)
    train_labels_categorical = to_categorical(train_labels, num_classes=10)
    test_labels_categorical = to_categorical(test_labels, num_classes=10)

    cnn_model = construct_model()
    cnn_model.fit(train_features, train_labels_categorical, batch_size=32, epochs=30, verbose=1, validation_data=(test_features, test_labels_categorical))

    assess_model(cnn_model, test_features, test_labels)
    cnn_model.save('model.h5')

